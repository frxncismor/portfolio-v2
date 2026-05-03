export interface GlobantClient {
  name: string
  icon: string
}

export interface FreelanceItem {
  title: string
  description: string
  url?: string
  wip?: boolean
}

export const globantClients: GlobantClient[] = [
  { name: 'Disney',                icon: 'corporate_fare'  },
  { name: 'Royal Caribbean',       icon: 'directions_boat' },
  { name: 'United Airlines',       icon: 'flight_takeoff'  },
  { name: "Dick's Sporting Goods", icon: 'shopping_cart'   },
  { name: 'Gannett',               icon: 'newspaper'       },
]

export const freelanceProjects: FreelanceItem[] = [
  { title: 'Vaneybr Portfolio', description: 'Custom Angular portfolio built for a client',                      url: 'https://www.vaneybr.com/home'            },
  { title: 'Shelfie',           description: 'AI SaaS for small business product photography',                   url: 'https://shelfie.com.mx/'                 },
  { title: 'Caro Sweet MUA',    description: 'Brand & booking site for a professional makeup artist',            url: 'https://caro-sweet-mua.vercel.app/'      },
  { title: 'Nox Coffee',        description: 'Motion-driven brand experience for a fictional coffee company',    url: 'https://nox-coffee.vercel.app/', wip: true },
]
