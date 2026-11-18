"""Production smoke and integration tests with Python Playwright and Chrome."""

import argparse
import json
import re
import sys
import unittest
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

PRODUCT_CODES = {
    "SK01", "SK02", "SK03", "SK04", "SK05", "SK06", "SK07", "SK08",
    "SK09", "SK10", "SK11", "SK12", "NB01", "NB02", "NB03", "NB04",
}
CART_KEY = "chef-kuhnya.cart.v1"
RUB = r"\s*₽"


class StoreBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(channel="chrome", headless=True)
        print(f"Chrome {cls.browser.version} — {config.url}", flush=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.errors = []
        self.events = []
        self.page = self.new_page(width=1440, height=900)

    def new_page(self, *, width, height, mobile=False):
        page = self.browser.new_page(
            viewport={"width": width, "height": height}, locale="ru-RU",
            is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1,
        )
        self.addCleanup(page.context.close)
        page.set_default_timeout(4000)
        page.on("pageerror", lambda error: self.errors.append(str(error)))
        page.on("console", self.capture_console_error)
        page.on("response", self.capture_response_error)
        page.on("request", lambda request: self.events.append(
            (request.method, request.resource_type, request.url)
        ))
        return page

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def capture_console_error(self, message):
        if message.type == "error":
            self.errors.append(message.text)

    def capture_response_error(self, response):
        if response.status >= 400:
            self.errors.append(f"{response.status} — {response.url}")

    def go(self, route=""):
        response = self.page.goto(config.url + ("#" + route if route else ""), wait_until="networkidle")
        if response is None:
            response = self.page.reload(wait_until="networkidle")
        if response is not None:
            self.assertTrue(response.ok, f"{response.status} — {response.url}")
        expect(self.page.get_by_role("main").get_by_role("heading", level=1)).to_be_visible()

    def main(self):
        return self.page.get_by_role("main")

    def button(self, name, root=None):
        return (root or self.main()).get_by_role("button", name=name, exact=True)

    def catalog_codes(self):
        links = self.main().locator('a[href*="/product/"]').evaluate_all(
            "(links) => [...new Set(links.map((link) => link.href.split('/').pop()))]"
        )
        return links

    def assert_imgs_decode(self):
        images = self.page.locator("img").evaluate_all(
            """async (images) => {
              const broken = await Promise.all(images.map(async (image) => {
                image.loading = 'eager';
                try { await image.decode(); return image.naturalWidth ? null : image.src; }
                catch { return image.src; }
              }));
              return broken.filter(Boolean);
            }"""
        )
        self.assertEqual(images, [])

    def test_public_routes_metadata_and_all_product_details(self):
        routes = {
            "": re.compile("Обед уже"),
            "/catalog": "Каталог",
            "/delivery": "Как будет устроен заказ",
            "/b2b": "Домашние блюда в вашем меню",
            "/about": "Домашний запас",
            "/cart": "Корзина",
            "/checkout": "Демонстрационное оформление",
            "/success": "Демонстрационное оформление",
        }
        known_links = {"#/", "#main", *("#" + route for route in routes if route)}
        known_links.update(f"#/product/{code}" for code in PRODUCT_CODES)
        for route, title in routes.items():
            with self.subTest(route=route):
                self.go(route)
                expect(self.main().get_by_role("heading", level=1)).to_have_text(title)
                self.assertEqual(self.page.locator("html").get_attribute("lang"), "ru")
                self.assertGreater(len(self.page.title().strip()), 0)
                self.assertTrue(self.page.locator('meta[name="description"]').get_attribute("content"))
                self.assertTrue(self.page.locator('meta[property="og:title"]').get_attribute("content"))
                expect(self.page.locator('link[rel*="icon"]').first).to_have_count(1)
                self.assert_imgs_decode()
                links = self.page.locator("a[href]").evaluate_all(
                    "(items) => items.map(item => item.getAttribute('href').split('?')[0])"
                )
                self.assertLessEqual(set(links), known_links)

        for code in sorted(PRODUCT_CODES):
            with self.subTest(product=code):
                self.go(f"/product/{code}")
                expect(self.main().get_by_text(re.compile(r"\d\s*г(?:\s|$)")).first).to_be_visible()
                expect(self.main().get_by_text(re.compile(r"\d" + RUB)).first).to_be_visible()
                expect(self.main().get_by_role("button", name=re.compile("В корзину"))).to_be_visible()
                self.assert_imgs_decode()

        self.go("/product/nb-unknown")
        expect(self.main()).to_contain_text(re.compile(r"не найден", re.IGNORECASE))

        self.go()
        self.main().get_by_role("link", name="Выбрать блюда", exact=True).click()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Каталог")
        navigation = self.page.get_by_role("navigation", name="Основная навигация")
        expect(navigation.get_by_role("link", name="Каталог", exact=True)).to_have_attribute("aria-current", "page")
        navigation.get_by_role("link", name="Доставка и оплата", exact=True).click()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Как будет устроен заказ")

    def test_catalog_search_categories_filters_and_sort(self):
        self.go("/catalog")
        self.assertEqual(set(self.catalog_codes()), PRODUCT_CODES)
        for category, count in [("Супы", 5), ("Вторые блюда", 5), ("Завтраки", 2), ("Наборы", 4)]:
            with self.subTest(category=category):
                self.button(category).click()
                self.assertEqual(len(self.catalog_codes()), count)

        self.button("Все").click()
        search = self.main().get_by_role("searchbox", name="Поиск по меню")
        search.fill("боРЩ")
        self.assertEqual(self.catalog_codes(), ["SK01", "NB01"])
        search.fill("результата точно нет")
        expect(self.main().get_by_text("Блюда не найдены", exact=True)).to_be_visible()
        search.clear()
        self.assertEqual(len(self.catalog_codes()), 16)

        sort = self.main().get_by_role("combobox", name="Сортировка")
        sort.select_option(label="Сначала дешевле")
        self.assertEqual(self.catalog_codes()[0], "SK04")
        sort.select_option(label="Сначала дороже")
        self.assertEqual(self.catalog_codes()[0], "NB02")

        price = self.main().get_by_role("spinbutton", name="Цена до")
        price.fill("199")
        self.assertEqual(self.catalog_codes(), ["SK04"])
        price.clear()
        for name in ["Масса", "Тип позиции"]:
            with self.subTest(filter=name):
                select = self.main().get_by_role("combobox", name=name)
                options = select.locator("option").all_text_contents()
                self.assertGreater(len(options), 1)
                select.select_option(index=1)
                self.assertTrue(0 < len(self.catalog_codes()) < 16)
                select.select_option(index=0)
                self.assertEqual(len(self.catalog_codes()), 16)

        kind = self.main().get_by_role("combobox", name="Тип позиции")
        kind.select_option(label="Наборы")
        self.assertEqual(set(self.catalog_codes()), {"NB01", "NB02", "NB03", "NB04"})
        self.button("Сбросить фильтры").click()
        self.assertEqual(len(self.catalog_codes()), 16)

        self.go("/catalog?category=Завтраки")
        self.assertEqual(set(self.catalog_codes()), {"SK10", "SK11"})
        self.page.reload(wait_until="networkidle")
        self.assertEqual(set(self.catalog_codes()), {"SK10", "SK11"})

    def test_cart_persistence_totals_removal_and_demo_network(self):
        self.go("/catalog")
        self.button("Добавить в корзину: Борщ с говядиной").click()
        self.button("Добавить в корзину: Обед на двоих").click()
        self.go("/cart")
        expect(self.main()).to_contain_text(re.compile(r"1\s?228" + RUB))
        self.assertEqual(self.page.evaluate(f"JSON.parse(localStorage.getItem('{CART_KEY}'))"), {"SK01": 1, "NB02": 1})
        self.page.reload(wait_until="networkidle")
        expect(self.main()).to_contain_text(re.compile(r"1\s?228" + RUB))
        self.main().get_by_role("button", name=re.compile(r"Увеличить.*Борщ")).click()
        expect(self.main()).to_contain_text(re.compile(r"1\s?477" + RUB))
        self.main().get_by_role("button", name=re.compile(r"Уменьшить.*Борщ")).click()
        expect(self.main()).to_contain_text(re.compile(r"1\s?228" + RUB))
        self.main().get_by_role("button", name=re.compile(r"Удалить.*Обед на двоих")).click()
        expect(self.main().get_by_text("Обед на двоих", exact=True)).to_have_count(0)
        self.assertEqual(self.page.evaluate(f"JSON.parse(localStorage.getItem('{CART_KEY}'))"), {"SK01": 1})

        self.main().get_by_role("link", name="Перейти к оформлению", exact=True).click()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Демонстрационное оформление")
        expect(self.main()).to_contain_text(re.compile(r"249" + RUB))
        expect(self.main().locator("input, textarea")).to_have_count(0)
        storage_before = self.page.evaluate("JSON.stringify(localStorage)")
        self.events.clear()
        self.button("Завершить демонстрацию").click()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Демонстрация завершена")
        self.page.wait_for_load_state("networkidle")
        self.assertEqual(self.page.evaluate("JSON.stringify(localStorage)"), storage_before)
        self.assert_no_submission()

        self.go("/cart")
        self.main().get_by_role("button", name=re.compile(r"Удалить.*Борщ")).click()
        expect(self.main().get_by_text("Корзина пока пуста", exact=True)).to_be_visible()
        self.page.reload(wait_until="networkidle")
        expect(self.main().get_by_text("Корзина пока пуста", exact=True)).to_be_visible()

    def assert_no_submission(self):
        self.assertEqual([
            event for event in self.events
            if event[0] not in {"GET", "HEAD"} or event[1] in {"fetch", "xhr", "websocket", "ping"}
        ], [])

    def test_partner_demo_without_contact_fields_or_submission(self):
        self.go("/b2b")
        expect(self.main().locator("input, textarea")).to_have_count(0)
        segment = self.main().get_by_role("combobox", name="Формат бизнеса")
        categories = segment.locator("option").all_text_contents()
        self.assertGreaterEqual(len(categories), 3)
        storage_before = self.page.evaluate("JSON.stringify(localStorage)")
        self.events.clear()
        for index, category in enumerate(categories):
            with self.subTest(category=category):
                segment.select_option(index=index)
                self.button("Показать пример условий").click()
                result = self.main().get_by_role("status")
                expect(result).to_contain_text(category)
                expect(result).to_contain_text("Заявка не отправлялась")
        self.page.wait_for_load_state("networkidle")
        self.assertEqual(self.page.evaluate("JSON.stringify(localStorage)"), storage_before)
        self.assert_no_submission()

    def test_responsive_layout_across_requested_widths(self):
        for width in (360, 390, 768, 1024, 1440):
            self.page.set_viewport_size({"width": width, "height": 900})
            for route in ("", "/catalog", "/product/SK01", "/b2b", "/delivery", "/about", "/cart"):
                with self.subTest(width=width, route=route):
                    self.go(route)
                    overflow = self.page.evaluate(
                        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
                    )
                    self.assertLessEqual(overflow, 1)
                    if route == "/catalog":
                        card = self.main().locator('a[href*="/product/"]').first
                        expect(card).to_be_visible()
                        photo = card.locator("img")
                        expect(photo).to_be_visible()
                        image = photo.bounding_box()
                        self.assertGreater(image["height"], 24)
                        self.assertLessEqual(image["x"] + image["width"], width + 1)
                        self.assertIn(photo.evaluate("(image) => getComputedStyle(image).objectFit"), {"cover", "contain"})
                        add = self.button("Добавить в корзину: Борщ с говядиной")
                        self.assertGreaterEqual(add.bounding_box()["height"], 24)
                        if config.evidence_dir and width in (390, 1440):
                            self.page.screenshot(path=config.evidence_dir / f"catalog-{width}.png")

        self.page.set_viewport_size({"width": 390, "height": 844})
        self.go("/catalog")
        self.button("Добавить в корзину: Борщ с говядиной").click()
        self.go("/cart")
        expect(self.main()).to_contain_text(re.compile(r"249" + RUB))
        self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), 391)
        self.main().get_by_role("link", name="Перейти к оформлению").click()
        expect(self.button("Завершить демонстрацию")).to_be_visible()
        self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), 391)

    def test_keyboard_skip_link_search_dialog_and_focus(self):
        self.page.emulate_media(reduced_motion="reduce")
        self.go()
        self.page.keyboard.press("Tab")
        focused = self.page.locator(":focus")
        self.assertIn("содерж", focused.inner_text().lower())
        self.assertTrue(focused.evaluate("(element) => element.matches(':focus-visible')"))
        self.page.keyboard.press("Enter")
        self.assertTrue(self.main().evaluate("(main) => main.contains(document.activeElement)"))

        search_toggle = self.page.get_by_role("button", name="Открыть поиск", exact=True)
        search_toggle.focus()
        self.page.keyboard.press("Enter")
        dialog = self.page.get_by_role("dialog", name="Поиск по меню")
        expect(dialog).to_be_visible()
        query = dialog.get_by_role("searchbox", name="Название блюда")
        expect(query).to_be_focused()
        self.page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()
        expect(search_toggle).to_be_focused()
        self.page.keyboard.press("Enter")
        expect(query).to_be_focused()
        query.fill("Сырники")
        query.press("Enter")
        expect(dialog).not_to_be_visible()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Каталог")
        expect(self.main().get_by_role("searchbox", name="Поиск по меню")).to_have_value("Сырники")
        self.assertEqual(set(self.catalog_codes()), {"SK10", "NB03"})

    def test_mobile_menu_and_bundle_links(self):
        self.page = self.new_page(width=390, height=844, mobile=True)
        self.go()
        menu = self.page.get_by_role("button", name="Открыть меню", exact=True)
        self.assertGreaterEqual(menu.bounding_box()["height"], 24)
        menu.tap()
        dialog = self.page.get_by_role("dialog", name="Меню")
        expect(dialog).to_be_visible()
        dialog.get_by_role("link", name="Каталог", exact=True).tap()
        expect(dialog).not_to_be_visible()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Каталог")
        self.button("Наборы").tap()
        self.main().get_by_role("link", name=re.compile("Обед на двоих")).tap()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Обед на двоих")
        expect(self.main().get_by_role("heading", name="В наборе", exact=True)).to_be_visible()
        self.assertEqual(set(self.catalog_codes()), {"SK02", "SK07"})
        self.main().locator('a[href="#/product/SK02"]').tap()
        expect(self.main().get_by_role("heading", level=1)).to_contain_text("Щи")
        self.main().get_by_role("button", name=re.compile("Увеличить.*Щи")).tap()
        self.button("В корзину").tap()
        self.main().get_by_role("link", name="Открыть корзину").tap()
        expect(self.main().get_by_role("heading", level=1)).to_have_text("Корзина")
        self.assertEqual(self.page.evaluate(f"JSON.parse(localStorage.getItem('{CART_KEY}'))"), {"SK02": 2})

    def test_optional_axe_accessibility(self):
        if config.axe is None:
            self.skipTest("Для расширенной проверки укажите --axe")
        for width in (390, 1440):
            self.page.set_viewport_size({"width": width, "height": 900})
            for route in ("", "/catalog", "/product/SK01", "/product/NB02", "/cart", "/about", "/b2b", "/delivery"):
                with self.subTest(width=width, route=route):
                    self.go(route)
                    self.page.add_script_tag(path=config.axe)
                    violations = self.page.evaluate(
                        """async () => (await axe.run(document, {
                          runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}
                        })).violations.map(({id, impact, nodes}) => ({
                          id, impact, nodes: nodes.map(({target, failureSummary}) => ({target, failureSummary}))
                        }))"""
                    )
                    self.assertEqual(violations, [], json.dumps(violations, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Base URL, including the GitHub Pages subdirectory if needed")
    parser.add_argument("--axe", type=Path, help="Optional path to axe.min.js")
    parser.add_argument("--evidence-dir", type=Path, help="Optional directory for reference screenshots")
    config, tests = parser.parse_known_args()
    if urlsplit(config.url).scheme not in {"http", "https"}:
        parser.error("URL must begin with http:// or https://")
    config.url = config.url.rstrip("/") + "/"
    if config.evidence_dir:
        config.evidence_dir.mkdir(parents=True, exist_ok=True)
    unittest.main(argv=[sys.argv[0], "-v", *tests])
