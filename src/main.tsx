import { StrictMode, useEffect, useRef, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { CartProvider } from './cart'
import { Shop } from './components/Shop'
import { Header, Footer } from './components/Frame'
import { Home } from './Home'
import { About, Delivery, Partners } from './Information'
import { products } from './data/catalog'
import './styles.css'

const listen = (fn: () => void) => {window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn)}
const getRoute = () => window.location.hash.slice(1) || '/'
const routes: Record<string,string> = {'/':'Обед уже в морозилке','/catalog':'Каталог','/cart':'Корзина','/checkout':'Демонстрационное оформление','/success':'Итог демонстрации','/about':'О нас','/delivery':'Доставка и оплата','/b2b':'Для бизнеса'}
function App() {
  const route = useSyncExternalStore(listen, getRoute)
  const path = route.split('?')[0]
  const previousPath = useRef(path)
  const main = useRef<HTMLElement>(null)
  useEffect(() => {
    const product = path.startsWith('/product/') ? products.find(p => p.id === path.split('/')[2]) : undefined
    document.title = (product?.name ?? routes[path] ?? 'Страница не найдена') + ' — Шеф кухня'
    if (previousPath.current !== path) {
      main.current?.focus({preventScroll:true})
      window.scrollTo({top:0,behavior:'instant'})
      previousPath.current = path
    }
  }, [path])
  const commerce = ['/catalog','/cart','/checkout','/success'].includes(path) || path.startsWith('/product/')
  return <><a className="skip" href="#main" onClick={e => {e.preventDefault(); main.current?.focus(); main.current?.scrollIntoView()}}>К содержанию</a><Header path={path}/>
    <main id="main" ref={main} tabIndex={-1}>{commerce ? <Shop route={route}/> : path === '/' ? <Home/> : path === '/about' ? <About/> : path === '/delivery' ? <Delivery/> : path === '/b2b' ? <Partners/> : <section className="shell info-wrap"><h1>Страница не найдена</h1><a className="action" href="#/catalog">Открыть каталог</a></section>}</main>
    <Footer/></>
}
createRoot(document.getElementById('root')!).render(<StrictMode><CartProvider><App/></CartProvider></StrictMode>)
