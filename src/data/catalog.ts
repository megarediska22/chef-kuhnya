export const categories = ['Супы', 'Вторые блюда', 'Завтраки', 'Наборы']

export interface Product {
  id: string
  name: string
  category: string
  weight: number
  price: number
  description: string
  ingredients: string[]
  image: string
  rank: number
  kind: 'dish' | 'bundle'
  components?: { productId: string; quantity: number }[]
}

const catalog: Omit<Product, 'image' | 'ingredients'>[] = [
  {
    id: 'SK01',
    name: 'Борщ с говядиной',
    category: 'Супы',
    weight: 350,
    price: 249,
    description: 'Домашний борщ с говядиной, свёклой, капустой и картофелем.',
    rank: 1,
    kind: 'dish',
  },
  {
    id: 'SK06',
    name: 'Плов с курицей',
    category: 'Вторые блюда',
    weight: 350,
    price: 269,
    description: 'Рис с курицей, морковью и луком. Порция на обед или ужин.',
    rank: 2,
    kind: 'dish',
  },
  {
    id: 'SK04',
    name: 'Тыквенный суп-пюре',
    category: 'Супы',
    weight: 330,
    price: 199,
    description: 'Однородный суп-пюре из тыквы с морковью и луком.',
    rank: 3,
    kind: 'dish',
  },
  {
    id: 'SK07',
    name: 'Тефтели из индейки с гречкой',
    category: 'Вторые блюда',
    weight: 350,
    price: 319,
    description: 'Тефтели из индейки в томатном соусе с гречневым гарниром.',
    rank: 4,
    kind: 'dish',
  },
  {
    id: 'SK02',
    name: 'Щи с курицей',
    category: 'Супы',
    weight: 350,
    price: 219,
    description: 'Щи с курицей, капустой, картофелем и морковью.',
    rank: 5,
    kind: 'dish',
  },
  {
    id: 'SK03',
    name: 'Гороховый суп с копчёной грудинкой',
    category: 'Супы',
    weight: 350,
    price: 239,
    description: 'Суп из колотого гороха с копчёной свиной грудинкой и морковью.',
    rank: 6,
    kind: 'dish',
  },
  {
    id: 'SK08',
    name: 'Курица в томатном соусе с булгуром',
    category: 'Вторые блюда',
    weight: 350,
    price: 279,
    description: 'Курица в томатном соусе и булгур на гарнир в одной порции.',
    rank: 7,
    kind: 'dish',
  },
  {
    id: 'SK05',
    name: 'Грибной суп-пюре',
    category: 'Супы',
    weight: 330,
    price: 239,
    description: 'Суп-пюре из шампиньонов со сливками и картофелем.',
    rank: 8,
    kind: 'dish',
  },
  {
    id: 'SK10',
    name: 'Сырники готовые',
    category: 'Завтраки',
    weight: 240,
    price: 279,
    description: 'Творожные сырники на завтрак или к чаю.',
    rank: 9,
    kind: 'dish',
  },
  {
    id: 'SK12',
    name: 'Чечевичное рагу с овощами',
    category: 'Вторые блюда',
    weight: 330,
    price: 219,
    description: 'Чечевица с томатами, морковью, луком и сладким перцем.',
    rank: 10,
    kind: 'dish',
  },
  {
    id: 'SK09',
    name: 'Гуляш из говядины с гречкой',
    category: 'Вторые блюда',
    weight: 350,
    price: 379,
    description: 'Гуляш из говядины с томатами, луком и морковью. На гарнир гречка.',
    rank: 11,
    kind: 'dish',
  },
  {
    id: 'SK11',
    name: 'Блинчики с творогом готовые',
    category: 'Завтраки',
    weight: 260,
    price: 249,
    description: 'Блинчики с творожной начинкой для завтрака или перекуса.',
    rank: 12,
    kind: 'dish',
  },
  {
    id: 'NB01',
    name: 'Обед с борщом и пловом',
    category: 'Наборы',
    weight: 700,
    price: 479,
    description: 'Первое и второе на одного. Борщ с говядиной и плов с курицей, каждый отдельной порцией.',
    rank: 49,
    kind: 'bundle',
    components: [
      { productId: 'SK01', quantity: 1 },
      { productId: 'SK06', quantity: 1 },
    ],
  },
  {
    id: 'NB02',
    name: 'Обед на двоих',
    category: 'Наборы',
    weight: 1400,
    price: 979,
    description: 'По порции щей с курицей и тефтелей из индейки с гречкой для каждого.',
    rank: 50,
    kind: 'bundle',
    components: [
      { productId: 'SK02', quantity: 2 },
      { productId: 'SK07', quantity: 2 },
    ],
  },
  {
    id: 'NB03',
    name: 'Завтраки на выходные',
    category: 'Наборы',
    weight: 740,
    price: 729,
    description: 'Две порции сырников и одна порция блинчиков с творогом.',
    rank: 51,
    kind: 'bundle',
    components: [
      { productId: 'SK10', quantity: 2 },
      { productId: 'SK11', quantity: 1 },
    ],
  },
  {
    id: 'NB04',
    name: 'Растительный обед',
    category: 'Наборы',
    weight: 660,
    price: 389,
    description: 'Одна порция тыквенного супа-пюре и одна порция чечевичного рагу с овощами.',
    rank: 52,
    kind: 'bundle',
    components: [
      { productId: 'SK04', quantity: 1 },
      { productId: 'SK12', quantity: 1 },
    ],
  },
]

export const products: Product[] = catalog.map((product) => ({
  ...product,
  ingredients: [],
  image: `${import.meta.env.BASE_URL}media/${product.id.toLowerCase()}.webp`,
}))

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function rub(value: number): string {
  return currency.format(value)
}
