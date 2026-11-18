import { useState } from 'react'
import { categories, products } from './data/catalog'
import { ProductCard } from './components/Shop'
import { Icon } from './components/Icons'

const media = import.meta.env.BASE_URL + 'media/'
export function Home() {
  const [category, setCategory] = useState('Выбор кухни')
  const items = (category === 'Выбор кухни' ? products : products.filter(p => p.category === category)).slice(0, 4)
  return <>
    <section className="home-hero"><div className="shell hero-grid">
      <div className="hero-copy"><div className="overline"><span />Домашний запас</div>
        <h1>Обед уже<br/><em>в морозилке.</em></h1>
        <p>Борщ, плов, сырники и другие домашние блюда. Выберите порции на неделю и разогревайте, когда удобно.</p>
        <div className="hero-actions"><a className="action hero-cta" href="#/catalog">Выбрать блюда <Icon name="arrow" size={20}/></a><small>Демоверсия магазина</small></div>
      </div>
      <div className="hero-picture"><picture><source type="image/avif" srcSet={media+'hero-480.avif 480w, '+media+'hero-800.avif 800w, '+media+'hero-1200.avif 1200w'} sizes="(max-width: 760px) 92vw, 52vw"/><source type="image/webp" srcSet={media+'hero-640.webp 640w, '+media+'hero.webp 1200w'} sizes="(max-width: 730px) 100vw, 55vw"/><img src={media+'hero.webp'} alt="Борщ со свёклой и говядиной, зелень и ржаной хлеб" width="1200" height="850" fetchPriority="high" /></picture>
        <a href="#/product/SK01" className="photo-note"><span><small>В тарелке</small><strong>Борщ с говядиной</strong></span><span className="note-arrow"><Icon name="up" size={16}/></span></a>
      </div></div></section>
    <div className="benefit-band"><ul className="shell benefit-list">
      <li><Icon name="snow" size={26}/><span>Запас в морозилке</span></li><li><Icon name="bowl" size={26}/><span>Блюда по порциям</span></li><li><Icon name="stack" size={26}/><span>Наборы на несколько обедов</span></li>
    </ul></div>
    <section className="shell menu-section" aria-labelledby="menu-heading"><div className="overline"><span/>Меню</div>
      <div className="section-heading"><h2 id="menu-heading">Что на обед?</h2><a className="text-link" href="#/catalog">Весь каталог <Icon name="arrow" size={19}/></a></div>
      <div className="home-filters" aria-label="Подборка блюд">{['Выбор кухни', ...categories].map(c => <button key={c} type="button" aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</button>)}</div>
      <div className="home-cards">{items.map(p => <ProductCard key={p.id} product={p}/>)}</div>
    </section>
    <section className="shell"><div className="home-story"><img loading="lazy" decoding="async" src={media+'story.webp'} width="660" height="470" alt="Свёкла, морковь и зелень на кухонной доске" /><div>
      <div className="overline"><span/>О нашей кухне</div><h2>Домашнее меню<br/><em>про запас.</em></h2><p>Пара супов, любимое второе и завтрак на выходной. Мы собираем «Шеф кухню» вокруг простой идеи — держать знакомые блюда в морозилке и выбирать по настроению.</p><a className="text-link" href="#/about">О бренде <Icon name="arrow" size={18}/></a></div></div></section>
    <div className="shell home-guides"><section><div className="overline"><span/>Для дома</div><h2>Доставка и оплата</h2><p>Магазин работает в деморежиме. Узнайте, как устроена корзина и какие условия появятся к запуску.</p><a className="text-link" href="#/delivery">Условия магазина <Icon name="arrow" size={18}/></a></section>
    <section><div className="overline"><span/>Для бизнеса</div><h2>Кафе и магазинам</h2><p>Подберите блюда для меню кафе, столовой или магазинной морозильной витрины.</p><a className="text-link" href="#/b2b">Варианты сотрудничества <Icon name="arrow" size={18}/></a></section></div>
  </>
}
