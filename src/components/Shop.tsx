import { useId, useRef, useState } from 'react'
import { MAX_QUANTITY, useCart } from '../cart'
import { categories, products, rub } from '../data/catalog'
import type { Product } from '../data/catalog'
import './shop.css'

function Icon({ name }: { name: 'plus' | 'minus' | 'search' | 'check' | 'back' | 'bag' }) {
  const shapes = {
    plus: 'M10 4v12M4 10h12',
    minus: 'M4 10h12',
    search: 'M15 15l3 3M8.5 14.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z',
    check: 'm4 10 4 4 8-8',
    back: 'M16 10H4m0 0 5 5m-5-5 5-5',
    bag: 'M4 7h12l1.2 11H2.8L4 7Zm3 0V5a3 3 0 1 1 6 0v2',
  }
  return <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d={shapes[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function catalogLink(category?: string) {
  return category ? `#/catalog?category=${encodeURIComponent(category)}` : '#/catalog'
}

function productLink(id: string) {
  return `#/product/${id}`
}

const countFormat = new Intl.PluralRules('ru')

function positionCount(count: number) {
  const form = countFormat.select(count)
  const noun = form === 'one' ? 'позиция' : form === 'few' ? 'позиции' : 'позиций'
  return `${count} ${noun}`
}

export function ProductCard({ product, eager = false, headingLevel = 3 }: {
  product: Product
  eager?: boolean
  headingLevel?: 2 | 3
}) {
  const { add, quantities } = useCart()
  const quantity = quantities[product.id] ?? 0
  const [feedback, setFeedback] = useState('')
  const photo = product.image.replace(/\.webp$/, '')
  const sizes = headingLevel === 2
    ? '(max-width: 480px) 92vw, (max-width: 760px) 46vw, (max-width: 1024px) 30vw, 23vw'
    : '(max-width: 930px) 45vw, 23vw'
  const Title = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="shop-card">
      <a className="shop-card-link" href={productLink(product.id)} aria-label={product.name}>
        <div className="shop-card-photo">
          <picture><source type="image/avif" srcSet={photo + '-360.avif 360w, ' + photo + '-720.avif 720w'} sizes={sizes} /><img src={product.image} alt="" width="720" height="478" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" /></picture>
        </div>
        <p className="shop-card-meta"><span>{product.category}</span><span>{product.weight} г</span></p>
        <Title>{product.name}</Title>
      </a>
      <div className="shop-card-bottom">
        <strong className="shop-price">{rub(product.price)}</strong>
        <button className="shop-add" type="button" aria-disabled={quantity >= MAX_QUANTITY} aria-label={`Добавить в корзину: ${product.name}`} onClick={() => {
          if (quantity >= MAX_QUANTITY) return
          add(product.id)
          setFeedback(`В корзине ${quantity + 1} шт. ${product.name}.`)
        }}>
          {quantity > 0 ? <span aria-hidden="true">{quantity}</span> : null}<Icon name="plus" />
        </button>
        <span className="shop-sr" role="status">{feedback}</span>
      </div>
    </article>
  )
}

const allCategories = 'Все'
const highestPrice = Math.max(...products.map((product) => product.price))
const bundles = products.filter((product) => product.kind === 'bundle')

const weights = [
  { label: 'Любая', min: 0, max: Infinity },
  { label: 'До 300 г', min: 0, max: 300 },
  { label: '301–500 г', min: 301, max: 500 },
  { label: 'Более 500 г', min: 501, max: Infinity },
]

const sorters = {
  recommended: (first: Product, second: Product) => first.rank - second.rank,
  'price-asc': (first: Product, second: Product) => first.price - second.price || first.rank - second.rank,
  'price-desc': (first: Product, second: Product) => second.price - first.price || first.rank - second.rank,
  weight: (first: Product, second: Product) => first.weight - second.weight || first.rank - second.rank,
  name: (first: Product, second: Product) => first.name.localeCompare(second.name, 'ru'),
}

type SortOrder = keyof typeof sorters

type CatalogFilters = {
  category: string
  query: string
  price: string
  weight: string
  kind: string
  sort: SortOrder
}

const initialFilters: CatalogFilters = {
  category: allCategories, query: '', price: '', weight: '0', kind: 'all', sort: 'recommended',
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()
}

function Catalog({ initialCategory, initialQuery }: { initialCategory: string; initialQuery: string }) {
  const [filters, setFilters] = useState<CatalogFilters>({ ...initialFilters, category: initialCategory, query: initialQuery })
  const searchInput = useRef<HTMLInputElement>(null)
  const categoriesForDisplay = [allCategories, ...categories]
  const queryWords = normalizeSearch(filters.query).split(/\s+/u).filter(Boolean)
  const selectedWeight = weights[Number(filters.weight)] ?? weights[0]
  const priceLimit = filters.price === '' ? Infinity : Number(filters.price)
  const matchingProducts = products.filter((product) => {
    if (filters.category !== allCategories && filters.category !== product.category) return false
    if (filters.kind !== 'all' && filters.kind !== product.kind) return false
    if (product.price > priceLimit) return false
    if (product.weight < selectedWeight.min || product.weight > selectedWeight.max) return false
    const components = product.components?.map(({ productId }) => products.find(p => p.id === productId)?.name ?? '').join(' ') ?? ''
    const searchText = normalizeSearch(`${product.name} ${product.description} ${components}`)
    return queryWords.every((word) => searchText.includes(word))
  }).sort(sorters[filters.sort])
  const hasFilters = Object.keys(initialFilters).some((key) => {
    const field = key as keyof CatalogFilters
    return filters[field] !== initialFilters[field]
  })

  function updateFilter<Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="shop-page shop-catalog" aria-labelledby="shop-catalog-title">
      <header className="shop-intro shop-intro-catalog">
        <h1 id="shop-catalog-title">Каталог</h1>
        <p>Супы, горячие блюда и завтраки для домашнего запаса. Цены и масса порций предварительные.</p>
      </header>
      <div className="shop-categories" aria-label="Категории" role="group">
        {categoriesForDisplay.map((category) => (
          <button type="button" key={category} aria-pressed={filters.category === category} onClick={() => updateFilter('category', category)}>{category}</button>
        ))}
      </div>
      <div className="shop-filters" role="search" aria-label="Поиск и фильтры каталога" onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLInputElement && event.target.type === 'search') updateFilter('query', '')
      }}>
        <label className="shop-field shop-search-field">
          <span>Поиск по меню</span>
          <span className="shop-search-input"><Icon name="search" /><input ref={searchInput} type="search" placeholder="Например, борщ" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} /></span>
        </label>
        <label className="shop-field">
          <span>Цена до</span>
          <input type="number" inputMode="numeric" min="0" step="1" placeholder={`${highestPrice} ₽`} value={filters.price} onChange={(event) => updateFilter('price', event.target.value)} />
        </label>
        <label className="shop-field">
          <span>Масса</span>
          <select value={filters.weight} onChange={(event) => updateFilter('weight', event.target.value)}>
            {weights.map((range, index) => <option key={range.label} value={String(index)}>{range.label}</option>)}
          </select>
        </label>
        {bundles.length > 0 ? (
          <label className="shop-field">
            <span>Тип позиции</span>
            <select value={filters.kind} onChange={(event) => updateFilter('kind', event.target.value)}>
              <option value="all">Все позиции</option><option value="dish">Блюда</option><option value="bundle">Наборы</option>
            </select>
          </label>
        ) : null}
        <label className="shop-field">
          <span>Сортировка</span>
          <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as SortOrder)}>
            <option value="recommended">Рекомендуемые</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="weight">По возрастанию массы</option><option value="name">По названию</option>
          </select>
        </label>
      </div>
      <div className="shop-results-bar">
        <p role="status">{positionCount(matchingProducts.length)}</p>
        {hasFilters ? <button className="shop-text-button" type="button" onClick={() => {
          searchInput.current?.focus()
          setFilters(initialFilters)
        }}>Сбросить фильтры</button> : null}
      </div>
      {matchingProducts.length > 0 ? (
        <div className="shop-card-grid">
          {matchingProducts.map((product, index) => <ProductCard key={product.id} product={product} headingLevel={2} eager={index === 0} />)}
        </div>
      ) : (
        <div className="shop-empty">
          <Icon name="search" />
          <h2>Блюда не найдены</h2>
          <p>Попробуйте изменить запрос или сбросить фильтры.</p>
        </div>
      )}
    </section>
  )
}

type QuantityProps = { name: string; value: number; max?: number; onChange: (quantity: number) => void }

function Quantity({ name, value, max = MAX_QUANTITY, onChange }: QuantityProps) {
  const quantityId = useId()
  return (
    <div className="shop-quantity" role="group" aria-label={`Количество: ${name}`}>
      <button type="button" aria-label={`Уменьшить количество: ${name}`} aria-describedby={quantityId} aria-disabled={value <= 1} onClick={() => {
        if (value > 1) onChange(value - 1)
      }}><Icon name="minus" /></button>
      <output id={quantityId}>{value}</output>
      <button type="button" aria-label={`Увеличить количество: ${name}`} aria-describedby={quantityId} aria-disabled={value >= max} onClick={() => {
        if (value < max) onChange(value + 1)
      }}><Icon name="plus" /></button>
    </div>
  )
}

function ProductDetail({ product }: { product: Product }) {
  const { add, quantities } = useCart()
  const [quantity, setQuantity] = useState(1)
  const inCart = quantities[product.id] ?? 0
  const remaining = MAX_QUANTITY - inCart
  const amount = Math.min(quantity, Math.max(1, remaining))
  const [feedback, setFeedback] = useState('')

  return (
    <section className="shop-page" aria-labelledby="shop-product-title">
      <a className="shop-back" href={catalogLink(product.category)}><Icon name="back" />К каталогу</a>
      <div className="shop-detail">
        <figure className="shop-detail-photo">
          <img src={product.image} alt={product.name} width="720" height="478" decoding="async" fetchPriority="high" />
          <figcaption>{product.kind === 'bundle' ? 'Иллюстрация набора' : 'Иллюстрация блюда'}</figcaption>
        </figure>
        <div className="shop-detail-info">
          <a className="shop-detail-category" href={catalogLink(product.category)}>{product.category}</a>
          <h1 id="shop-product-title">{product.name}</h1>
          <p className="shop-detail-description">{product.description}</p>
          <dl className="shop-detail-data">
            <div><dt>Масса</dt><dd>{product.weight} г</dd></div>
            <div><dt>Ориентировочная цена</dt><dd>{rub(product.price)}</dd></div>
          </dl>
          <div className="shop-detail-actions">
            <Quantity name={product.name} value={amount} max={remaining} onChange={setQuantity} />
            <button className="shop-button shop-button-primary" type="button" aria-disabled={remaining === 0} onClick={() => {
              if (remaining === 0) return
              add(product.id, amount)
              setFeedback(`Добавлено: ${amount} шт. В корзине ${inCart + amount} шт.`)
            }}>В корзину</button>
          </div>
          <div className="shop-detail-feedback">
            <p role="status">{remaining === 0 ? 'В корзине максимальное количество этой позиции.' : feedback}</p>
            {inCart > 0 ? <a href="#/cart">Открыть корзину</a> : null}
          </div>
          {product.components?.length ? (
            <div className="shop-product-notes">
              <h2>В наборе</h2>
              <ul>{product.components.map((component) => {
                const item = products.find((candidate) => candidate.id === component.productId)
                return item ? <li key={item.id}><a href={productLink(item.id)}>{item.name}</a> <span>× {component.quantity}</span></li> : null
              })}</ul>
            </div>
          ) : null}
          {product.kind === 'dish' && product.ingredients.length > 0 ? (
            <div className="shop-product-notes"><h2>Основные ингредиенты по проекту рецептуры</h2><p>{product.ingredients.join(', ')}.</p></div>
          ) : null}
          <p className="shop-verified-note">Состав, аллергены, пищевая ценность и режим разогрева уточняются перед запуском.</p>
        </div>
      </div>
    </section>
  )
}

function EmptyCart({ checkout }: { checkout: boolean }) {
  return (
    <div className="shop-empty">
      <Icon name="bag" />
      <h2>Корзина пока пуста</h2>
      <p>{checkout ? 'Добавьте блюда, чтобы пройти демонстрационное оформление.' : 'Соберите домашний запас из блюд в каталоге.'}</p>
      <a className="shop-button shop-button-primary" href="#/catalog">Перейти в каталог</a>
    </div>
  )
}

function Basket({ checkout = false }: { checkout?: boolean }) {
  const { lines, count, total, setQuantity, completeDemo } = useCart()
  const backLink = useRef<HTMLAnchorElement>(null)
  return (
    <section className="shop-page" aria-labelledby="shop-basket-title">
      <a ref={backLink} className="shop-back" href={checkout ? '#/cart' : '#/catalog'}><Icon name="back" />{checkout ? 'К корзине' : 'К каталогу'}</a>
      <header className="shop-intro">
        <h1 id="shop-basket-title">{checkout ? 'Демонстрационное оформление' : 'Корзина'}</h1>
        <p>{checkout ? 'Проверьте позиции и предварительную стоимость.' : 'Просмотрите выбранные блюда и количество порций.'}</p>
      </header>
      {lines.length === 0 ? <EmptyCart checkout={checkout} /> : (
        <div className="shop-basket-layout">
          <ul className="shop-basket-lines" aria-label={checkout ? 'Состав демонстрационного заказа' : 'Товары в корзине'}>
            {lines.map(({ product, quantity, subtotal }) => (
              <li key={product.id} className="shop-basket-line">
                <img src={product.image} alt="" width="720" height="478" loading="lazy" decoding="async" />
                <div className="shop-basket-product">
                  <a href={productLink(product.id)}>{product.name}</a>
                  <p>{product.weight} г <span aria-hidden="true">/</span> {rub(product.price)} за шт.</p>
                  {!checkout ? <button type="button" className="shop-text-button" aria-label={`Удалить: ${product.name}`} onClick={(event) => {
                    const adjacent = event.currentTarget.closest('li')?.nextElementSibling ?? event.currentTarget.closest('li')?.previousElementSibling
                    const focusTarget = adjacent?.querySelector<HTMLAnchorElement>('.shop-basket-product a') ?? backLink.current
                    focusTarget?.focus()
                    setQuantity(product.id, 0)
                  }}>Удалить</button> : null}
                </div>
                <div className="shop-basket-numbers">
                  {checkout ? <span>{quantity} шт.</span> : <Quantity name={product.name} value={quantity} onChange={(amount) => setQuantity(product.id, amount)} />}
                  <strong>{rub(subtotal)}</strong>
                </div>
              </li>
            ))}
          </ul>
          <aside className="shop-basket-summary" aria-labelledby="shop-summary-title">
            <h2 id="shop-summary-title">{checkout ? 'Сводка' : 'Ваш домашний запас'}</h2>
            <dl>
              <div><dt>Количество товаров</dt><dd>{count} шт.</dd></div>
              <div><dt>Предварительный итог</dt><dd><strong aria-live="polite" aria-atomic="true">{rub(total)}</strong></dd></div>
            </dl>
            <p>Сейчас магазин работает в демонстрационном режиме. Реальные заказы и оплата недоступны.</p>
            {checkout ? (
              <button className="shop-button shop-button-primary" type="button" onClick={() => {
                if (completeDemo()) window.location.hash = '/success'
              }}>Завершить демонстрацию</button>
            ) : <a className="shop-button shop-button-primary" href="#/checkout">Перейти к оформлению</a>}
          </aside>
        </div>
      )}
    </section>
  )
}

function DemoResult() {
  const { demoReceipt } = useCart()
  return (
    <section className="shop-page shop-result-page" aria-labelledby="shop-result-title">
      <div className="shop-empty shop-demo-result">
        <Icon name={demoReceipt ? 'check' : 'bag'} />
        <h1 id="shop-result-title">{demoReceipt ? 'Демонстрация завершена' : 'Демонстрационное оформление'}</h1>
        {demoReceipt ? (
          <>
            <p>{positionCount(demoReceipt.count)} на сумму {rub(demoReceipt.total)}. Заказ не создан, оплата не списана.</p>
            <a className="shop-button shop-button-primary" href="#/catalog">Вернуться в каталог</a>
          </>
        ) : (
          <>
            <p>Откройте корзину, чтобы проверить выбранные позиции и пройти сценарий оформления.</p>
            <a className="shop-button shop-button-primary" href="#/cart">Открыть корзину</a>
          </>
        )}
      </div>
    </section>
  )
}

export function Shop({ route }: { route: string }) {
  const [path, query = ''] = route.replace(/^#/u, '').split('?', 2)
  if (path === '/catalog') {
    const parameters = new URLSearchParams(query)
    const requestedCategory = parameters.get('category') ?? allCategories
    const category = categories.includes(requestedCategory) ? requestedCategory : allCategories
    const initialQuery = parameters.get('q') ?? ''
    return <Catalog key={JSON.stringify([category, initialQuery])} initialCategory={category} initialQuery={initialQuery} />
  }
  if (path === '/cart') return <Basket key="cart" />
  if (path === '/checkout') return <Basket key="checkout" checkout />
  if (path === '/success') return <DemoResult />
  const id = path.slice('/product/'.length)
  const product = path.startsWith('/product/') ? products.find((item) => item.id === id) : undefined
  if (product) return <ProductDetail key={product.id} product={product} />
  return (
    <section className="shop-page shop-result-page" aria-labelledby="shop-missing-title">
      <div className="shop-empty"><h1 id="shop-missing-title">Позиция не найдена</h1><a className="shop-button shop-button-primary" href="#/catalog">Перейти в каталог</a></div>
    </section>
  )
}
