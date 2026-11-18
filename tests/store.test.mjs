import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true, watch: null, ws: false },
  appType: 'custom',
})
after(() => server.close())

const { categories, products } = await server.ssrLoadModule('/src/data/catalog.ts')
const { MAX_QUANTITY, addCartQuantity, getCartSummary, parseCart, setCartQuantity } =
  await server.ssrLoadModule('/src/cart.ts')

test('каталог содержит пилотную линейку и четыре набора с уникальными кодами', () => {
  assert.equal(products.length, 16)
  assert.equal(new Set(products.map(({ id }) => id)).size, 16)
  assert.deepEqual(
    Object.fromEntries(
      categories.map((category) => [category, products.filter((product) => product.category === category).length]),
    ),
    { Супы: 5, 'Вторые блюда': 5, Завтраки: 2, Наборы: 4 },
  )
})

test('комплектность наборов ссылается на поддерживаемые одиночные блюда', () => {
  const dishes = new Set(products.filter(({ kind }) => kind === 'dish').map(({ id }) => id))
  const bundles = products.filter(({ kind }) => kind === 'bundle')
  assert.equal(dishes.size, 12)
  assert.equal(bundles.length, 4)
  for (const { id, components } of bundles) {
    assert.ok(components.length > 0, id)
    const componentIds = new Set()
    for (const { productId, quantity } of components) {
      assert.ok(dishes.has(productId), id)
      assert.ok(Number.isSafeInteger(quantity) && quantity > 0, id)
      assert.ok(!componentIds.has(productId), id)
      componentIds.add(productId)
    }
  }
})

test('сохранённая корзина восстанавливается и очищается от некорректных позиций', () => {
  assert.deepEqual(parseCart(null), {})
  assert.deepEqual(parseCart('{'), {})
  assert.deepEqual(parseCart('true'), {})
  assert.deepEqual(parseCart('["SK01"]'), {})
  assert.deepEqual(
    parseCart('{"SK01":2,"SK04":100,"SK05":0,"SK06":1.5,"SK07":-2,"SK08":"2","stale":2,"__proto__":2}'),
    { SK01: 2, SK04: MAX_QUANTITY },
  )
})

test('добавление, лимит и удаление сохраняют предыдущую корзину неизменной', () => {
  const before = Object.freeze({ SK01: 2 })
  const added = addCartQuantity(before, 'SK01')
  assert.deepEqual(added, { SK01: 3 })
  assert.deepEqual(addCartQuantity(added, 'SK01', 100), { SK01: MAX_QUANTITY })
  assert.deepEqual(setCartQuantity(added, 'SK01', 0), {})
  assert.deepEqual(setCartQuantity(added, 'SK01', -1), {})
  assert.deepEqual(before, { SK01: 2 })
})

test('недопустимые количества и неизвестные коды не меняют корзину', () => {
  const existing = { SK01: 1 }
  for (const quantity of [NaN, Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.strictEqual(setCartQuantity(existing, 'SK01', quantity), existing)
  }
  assert.strictEqual(addCartQuantity(existing, 'SK01', -5), existing)
  assert.strictEqual(addCartQuantity(existing, 'stale'), existing)
})

test('итог включает фиксированную цену набора и умножает её на количество', () => {
  const summary = getCartSummary({ SK01: 2, NB02: 1, stale: 5 })
  assert.equal(summary.count, 3)
  assert.equal(summary.total, 249 * 2 + 979)
  assert.deepEqual(
    summary.lines.map(({ product, quantity, subtotal }) => [product.id, quantity, subtotal]),
    [['SK01', 2, 498], ['NB02', 1, 979]],
  )
  assert.deepEqual(getCartSummary({}), { count: 0, total: 0, lines: [] })
})
