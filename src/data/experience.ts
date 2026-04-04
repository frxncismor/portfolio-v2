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
  { title: 'Vaneybr Portfolio',   description: 'Custom Angular portfolio built for a client',            url: 'https://www.vaneybr.com/home'              },
{ title: 'Kindnest',            description: 'Community platform with payments, in active development',   wip: true },
  { title: 'Contractors Project', description: 'AI-assisted client management platform',                        wip: true },
  { title: 'Shelfie',             description: 'AI SaaS for small business product photography',         url: 'https://shelfie.com.mx/'                   },
]
