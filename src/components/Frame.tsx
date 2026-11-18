import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart'
import { Icon, Mark } from './Icons'

const links = [['/catalog', 'Каталог'], ['/about', 'О нас'], ['/delivery', 'Доставка и оплата'], ['/b2b', 'Для бизнеса']]
export function Brand() {
  return <a className="brand" href="#/" aria-label="Шеф кухня — главная"><Mark /><span>Шеф кухня</span></a>
}
export function Header({ path }: { path: string }) {
  const { count } = useCart()
  const [panel, setPanel] = useState<'search' | 'menu' | null>(null)
  const [query, setQuery] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current
    if (panel && el && !el.open) {
      el.showModal()
      if (panel === 'search') el.querySelector<HTMLInputElement>('input[type=search]')?.focus()
    }
    if (!panel && el?.open) el.close()
    if (!panel) return
    function closeOnNav() { setPanel(null) }
    window.addEventListener('hashchange', closeOnNav)
    return () => window.removeEventListener('hashchange', closeOnNav)
  }, [panel])
  const nav = links.map(([href, label]) => <a key={href} href={'#' + href} aria-current={path === href ? 'page' : undefined} onClick={() => setPanel(null)}>{label}</a>)
  return <>
    <header className="mast"><div className="shell mast-inner"><Brand />
      <nav className="desktop-nav" aria-label="Основная навигация">{nav}</nav>
      <div className="mast-actions"><button className="icon-btn search-toggle" aria-label="Открыть поиск" onClick={() => {setQuery(''); setPanel('search')}}><Icon name="search" size={21} /></button>
      <a className="cart-head" href="#/cart" aria-label={'Корзина, позиций: ' + count}><Icon name="bag" size={21}/><span>Корзина</span><b>{count}</b></a>
      <button className="icon-btn mobile-toggle" onClick={() => setPanel('menu')} aria-label="Открыть меню"><Icon name="menu" /></button></div>
    </div></header>
    <dialog className="nav-dialog" ref={dialog} aria-labelledby="panel-title" onCancel={event => {event.preventDefault(); setPanel(null)}} onClick={e => {if (e.target === dialog.current) setPanel(null)}}>
      <div className="dialog-inside"><div className="dialog-top"><h2 id="panel-title">{panel === 'search' ? 'Поиск по меню' : 'Меню'}</h2><button className="icon-btn" aria-label="Закрыть" onClick={() => setPanel(null)}><Icon name="close" /></button></div>
      {panel === 'search' ? <form className="search-form" role="search" onSubmit={e => { e.preventDefault(); location.hash = '/catalog?q=' + encodeURIComponent(query.trim()); setPanel(null) }}>
        <label htmlFor="nav-search">Название блюда</label><input autoFocus id="nav-search" name="q" type="search" autoComplete="off" placeholder="Например, борщ…" value={query} onChange={e => setQuery(e.target.value)} /><button className="action">Найти в каталоге <Icon name="arrow" size={18}/></button>
      </form> : <nav className="drawer-nav" aria-label="Мобильная навигация">{nav}<a href="#/cart" onClick={() => setPanel(null)}>Корзина ({count})</a></nav>}</div>
    </dialog>
  </>
}
export function Footer() {
  return <footer className="footer"><div className="shell"><div className="footer-top"><div><Brand /><p>Домашние блюда для морозилки.</p></div><nav aria-label="Навигация в подвале">{links.map(([path, name]) => <a key={path} href={'#' + path}>{name}</a>)}</nav></div>
    <div className="footer-fine"><span>Демонстрационный магазин «Шеф кухня»</span><span>Цены предварительные. Изображения иллюстрируют подачу. Продажи пока закрыты.</span></div></div></footer>
}
