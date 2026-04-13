export type DepartmentTheme = {
  key: string
  label: string
  accent: string
  accentSoft: string
  accentDeep: string
  wordmark: string
  fallbackGradient: string
  heroImage?: string
  pattern: 'grid' | 'court' | 'field' | 'diamond' | 'track'
}

export const DEPARTMENT_THEMES: Record<string, DepartmentTheme> = {
  football: {
    key: 'football',
    label: 'Football',
    accent: '#CE1126',
    accentSoft: 'rgba(206, 17, 38, 0.14)',
    accentDeep: '#7F0C1A',
    wordmark: 'Football Operations',
    fallbackGradient: 'linear-gradient(135deg, #7F0C1A 0%, #CE1126 48%, #14213D 100%)',
    heroImage: '/department-themes/football.svg',
    pattern: 'field',
  },
  mens_basketball: {
    key: 'mens_basketball',
    label: "Men's Basketball",
    accent: '#13294B',
    accentSoft: 'rgba(19, 41, 75, 0.14)',
    accentDeep: '#0B1830',
    wordmark: "Men's Basketball",
    fallbackGradient: 'linear-gradient(135deg, #13294B 0%, #274C7A 48%, #CE1126 100%)',
    heroImage: '/department-themes/mens-basketball.svg',
    pattern: 'court',
  },
  womens_basketball: {
    key: 'womens_basketball',
    label: "Women's Basketball",
    accent: '#A81E3B',
    accentSoft: 'rgba(168, 30, 59, 0.14)',
    accentDeep: '#6E1327',
    wordmark: "Women's Basketball",
    fallbackGradient: 'linear-gradient(135deg, #6E1327 0%, #A81E3B 48%, #F0C7D1 100%)',
    heroImage: '/department-themes/womens-basketball.svg',
    pattern: 'court',
  },
  baseball: {
    key: 'baseball',
    label: 'Baseball',
    accent: '#0C447C',
    accentSoft: 'rgba(12, 68, 124, 0.14)',
    accentDeep: '#082A4E',
    wordmark: 'Baseball Operations',
    fallbackGradient: 'linear-gradient(135deg, #082A4E 0%, #0C447C 50%, #CE1126 100%)',
    heroImage: '/department-themes/baseball.svg',
    pattern: 'diamond',
  },
  softball: {
    key: 'softball',
    label: 'Softball',
    accent: '#D46A2E',
    accentSoft: 'rgba(212, 106, 46, 0.14)',
    accentDeep: '#8E441C',
    wordmark: 'Softball Operations',
    fallbackGradient: 'linear-gradient(135deg, #8E441C 0%, #D46A2E 48%, #13294B 100%)',
    heroImage: '/department-themes/softball.svg',
    pattern: 'diamond',
  },
  soccer: {
    key: 'soccer',
    label: 'Soccer',
    accent: '#3B6D11',
    accentSoft: 'rgba(59, 109, 17, 0.14)',
    accentDeep: '#203A0A',
    wordmark: 'Soccer Operations',
    fallbackGradient: 'linear-gradient(135deg, #203A0A 0%, #3B6D11 48%, #CE1126 100%)',
    heroImage: '/department-themes/soccer.svg',
    pattern: 'field',
  },
  volleyball: {
    key: 'volleyball',
    label: 'Volleyball',
    accent: '#5A4CC7',
    accentSoft: 'rgba(90, 76, 199, 0.14)',
    accentDeep: '#3A3180',
    wordmark: 'Volleyball Operations',
    fallbackGradient: 'linear-gradient(135deg, #3A3180 0%, #5A4CC7 48%, #CE1126 100%)',
    heroImage: '/department-themes/volleyball.svg',
    pattern: 'court',
  },
  golf: {
    key: 'golf',
    label: 'Golf',
    accent: '#6C8C2F',
    accentSoft: 'rgba(108, 140, 47, 0.14)',
    accentDeep: '#41551D',
    wordmark: 'Golf Operations',
    fallbackGradient: 'linear-gradient(135deg, #41551D 0%, #6C8C2F 48%, #13294B 100%)',
    heroImage: '/department-themes/golf.svg',
    pattern: 'field',
  },
  track: {
    key: 'track',
    label: 'Track & Field',
    accent: '#1A8F7A',
    accentSoft: 'rgba(26, 143, 122, 0.14)',
    accentDeep: '#105B4E',
    wordmark: 'Track & Field',
    fallbackGradient: 'linear-gradient(135deg, #105B4E 0%, #1A8F7A 48%, #13294B 100%)',
    heroImage: '/department-themes/track.svg',
    pattern: 'track',
  },
  rifle: {
    key: 'rifle',
    label: 'Rifle',
    accent: '#8B6D3C',
    accentSoft: 'rgba(139, 109, 60, 0.14)',
    accentDeep: '#5D4928',
    wordmark: 'Rifle Operations',
    fallbackGradient: 'linear-gradient(135deg, #5D4928 0%, #8B6D3C 48%, #13294B 100%)',
    heroImage: '/department-themes/rifle.svg',
    pattern: 'grid',
  },
  business_office: {
    key: 'business_office',
    label: 'Business Office',
    accent: '#14213D',
    accentSoft: 'rgba(20, 33, 61, 0.14)',
    accentDeep: '#0A1628',
    wordmark: 'Business Office',
    fallbackGradient: 'linear-gradient(135deg, #0A1628 0%, #14213D 56%, #CE1126 100%)',
    heroImage: '/department-themes/business-office.svg',
    pattern: 'grid',
  },
  information_technology: {
    key: 'information_technology',
    label: 'Information Technology',
    accent: '#5B6270',
    accentSoft: 'rgba(91, 98, 112, 0.14)',
    accentDeep: '#313640',
    wordmark: 'Information Technology',
    fallbackGradient: 'linear-gradient(135deg, #313640 0%, #5B6270 48%, #13294B 100%)',
    heroImage: '/department-themes/it.svg',
    pattern: 'grid',
  },
  ole_miss_athletics: {
    key: 'ole_miss_athletics',
    label: 'Ole Miss Athletics',
    accent: '#CE1126',
    accentSoft: 'rgba(206, 17, 38, 0.12)',
    accentDeep: '#0A1628',
    wordmark: 'Ole Miss Athletics',
    fallbackGradient: 'linear-gradient(135deg, #0A1628 0%, #13294B 44%, #CE1126 100%)',
    heroImage: '/department-themes/athletics.svg',
    pattern: 'grid',
  },
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getDepartmentTheme(departmentName?: string | null): DepartmentTheme {
  if (!departmentName) return DEPARTMENT_THEMES.ole_miss_athletics

  const slug = slugify(departmentName)

  if (slug.includes('football')) return DEPARTMENT_THEMES.football
  if (slug.includes('women') && slug.includes('basketball')) return DEPARTMENT_THEMES.womens_basketball
  if (slug.includes('men') && slug.includes('basketball')) return DEPARTMENT_THEMES.mens_basketball
  if (slug.includes('baseball')) return DEPARTMENT_THEMES.baseball
  if (slug.includes('softball')) return DEPARTMENT_THEMES.softball
  if (slug.includes('soccer')) return DEPARTMENT_THEMES.soccer
  if (slug.includes('volleyball')) return DEPARTMENT_THEMES.volleyball
  if (slug.includes('golf')) return DEPARTMENT_THEMES.golf
  if (slug.includes('track')) return DEPARTMENT_THEMES.track
  if (slug.includes('rifle')) return DEPARTMENT_THEMES.rifle
  if (slug.includes('business')) return DEPARTMENT_THEMES.business_office
  if (slug.includes('information_technology') || slug === 'it' || slug.includes('technology')) return DEPARTMENT_THEMES.information_technology

  return DEPARTMENT_THEMES.ole_miss_athletics
}
