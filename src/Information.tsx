import { useState } from 'react'
import { Icon } from './components/Icons'

const media = import.meta.env.BASE_URL + 'media/'
function Intro({label, title, lead}: {label: string; title: string; lead: string}) {
  return <><nav className="crumb" aria-label="Хлебные крошки"><a href="#/">Главная</a><span aria-hidden="true">/</span>{label}</nav><div className="info-intro"><div className="overline"><span/>{label}</div><h1>{title}</h1><p>{lead}</p></div></>
}
export function About() {
  return <article className="shell info-wrap"><Intro label="О нас" title="Домашний запас" lead="Шеф кухня — проект меню для тех дней, когда хочется знакомого обеда, а времени на готовку мало."/>
    <div className="about-feature"><img src={media+'story.webp'} alt="Овощи для домашнего супа на кухонном столе" width="760" height="520"/><div><h2>Одна порция —<br/><em>одно блюдо.</em></h2><p>В одном морозильнике могут соседствовать борщ для одного, тыквенный суп для другого и сырники к общему завтраку. Поэтому в основе меню — отдельные порции, которые удобно сочетать между собой.</p><p>В пилотную подборку вошли двенадцать блюд и четыре набора. Здесь можно изучить их и собрать пример заказа. Рецептуры, маркировка и условия продаж ещё готовятся к запуску.</p><a className="text-link" href="#/catalog">Посмотреть меню <Icon name="arrow" size={18}/></a></div></div>
  </article>
}
export function Delivery() {
  return <article className="shell info-wrap"><Intro label="Доставка и оплата" title="Как будет устроен заказ" lead="Сейчас можно собрать корзину и пройти оформление в деморежиме. Платить и оставлять адрес не требуется."/>
    <div className="info-columns"><section><Icon name="bag" size={28}/><h2>Оплата</h2><p>В корзине указана ориентировочная стоимость выбранных порций. На последнем шаге появится итог демонстрации. Денежного списания и регистрации реального заказа нет.</p></section>
    <section><Icon name="snow" size={28}/><h2>Доставка</h2><p>Зоны, тарифы, минимальную сумму и интервалы доставки предстоит утвердить. Когда начнутся продажи, покупатель сможет увидеть доступные условия до подтверждения заказа.</p></section>
    <section><Icon name="bowl" size={28}/><h2>Хранение и разогрев</h2><p>Продуктовая концепция предусматривает замороженные блюда. Для каждой позиции производитель должен утвердить срок хранения, температуру и способ разогрева и указать их на этикетке.</p></section></div>
    <a className="action" href="#/catalog">Перейти в каталог <Icon name="arrow" size={18}/></a>
  </article>
}
const proposals = {
  'Кафе или ресторан': 'Для обеденного меню можно обсудить суп и несколько вторых блюд. Для пробы подойдут борщ с говядиной и плов с курицей.',
  'Столовая': 'Для линейки горячих обедов можно сопоставить массу порции, чередование супов и гарниров и требования к разогреву.',
  'Магазин': 'Для морозильной витрины можно обсудить сочетание отдельных порций и наборов, место для этикетки и условия приёмки.',
  'Оптовая компания': 'Для поставок нескольким точкам предстоит согласовать ассортимент, кратность упаковки, график и требования к холодовой цепи.'
}
export function Partners() {
  const [segment, setSegment] = useState<keyof typeof proposals>('Кафе или ресторан')
  const [result, setResult] = useState<keyof typeof proposals | null>(null)
  return <article className="shell info-wrap"><Intro label="Для бизнеса" title="Домашние блюда в вашем меню" lead="Варианты сотрудничества для кафе, ресторанов, столовых, магазинов и оптовых партнёров."/>
    <div className="b2b-grid"><div className="b2b-text"><h2>Что можно обсудить</h2><p>Супы и вторые блюда для обеденного меню, завтраки к утреннему потоку, наборы для розничной витрины. Порционный формат помогает заранее сравнить массу и стоимость блюд.</p>
    <h3>Перед пробной поставкой</h3><p>Сторонам предстоит согласовать оптовую цену, образцы, документы, маркировку, упаковку, минимальную партию, условия хранения и график поставок. Объём и сроки производства пока открыты.</p>
    <a className="text-link" href="#/catalog">Изучить ассортимент <Icon name="arrow" size={18}/></a></div>
    <form className="partner-form" onSubmit={e => {e.preventDefault(); setResult(segment)}}><div className="overline"><span/>Демонстрационный запрос</div><h2>Условия для вашей точки</h2><label htmlFor="partner-type">Формат бизнеса</label><select id="partner-type" value={segment} onChange={e => {setSegment(e.target.value as keyof typeof proposals); setResult(null)}}>{Object.keys(proposals).map(s => <option key={s}>{s}</option>)}</select>
    <p>Посмотрите пример вопросов для обсуждения. Запрос останется в этом окне.</p><button className="action" type="submit">Показать пример условий <Icon name="arrow" size={18}/></button>
    <div className="partner-result" role="status">{result && <><h3>{result}</h3><p>{proposals[result]}</p><small>Это предварительный пример. Заявка не отправлялась.</small></>}</div></form></div>
  </article>
}
