/**/**/**

 * Content Data Transformers

 * Maps database contentData structures to component prop structures * Content Data Transformers * Content Data Transformers

 */

 *  * 

type DataRecord = Record<string, unknown>

 * Maps database contentData structures to component prop structures * Maps database contentData structures to component prop structures

export function transformHeroData(data: unknown) {

  const d = (data || {}) as DataRecord */ */

  const ctaPrimary = d.ctaPrimary as DataRecord

  const cta = d.cta as DataRecord

  const ctaSecondary = d.ctaSecondary as DataRecord

  import type {import type {

  return {

    badge: d.badge,  HeroSectionData,  HeroSectionData,

    heading: d.title || d.heading || '',

    description: d.description || '',  TextSectionData,  TextSectionData,

    primaryCta: ctaPrimary ? {

      text: String(ctaPrimary.text || ''),  FeaturesSectionData,  FeaturesSectionData,

      href: String(ctaPrimary.link || '')

    } : cta ? {  CardsSectionData,  CardsSectionData,

      text: String(cta.text || ''),

      href: String(cta.link || '')  TestimonialsSectionData,  TestimonialsSectionData,

    } : undefined,

    secondaryCta: ctaSecondary ? {  CTASectionData  CTASectionData

      text: String(ctaSecondary.text || ''),

      href: String(ctaSecondary.link || '')} from '@/components/sections'} from '@/components/sections'

    } : undefined,

    stats: d.stats,

    backgroundGradient: d.backgroundGradient

  }type DataRecord = Record<string, unknown>/**

}

 * Transform hero section data from database to component format

export function transformTextData(data: unknown) {

  const d = (data || {}) as DataRecord/** */

  

  return { * Transform hero section data from database to component formatexport function transformHeroData(data: unknown): HeroSectionData {

    heading: d.title || d.heading,

    subheading: d.subtitle || d.subheading, */  const d = data as Record<string, unknown>

    content: d.content || d.description || '',

    alignment: d.alignment,export function transformHeroData(data: unknown): HeroSectionData {  return {

    maxWidth: d.maxWidth,

    backgroundColor: d.backgroundColor,  const d = (data || {}) as DataRecord    badge: d?.badge as string | undefined,

    textColor: d.textColor,

    list: d.list || d.items  const ctaPrimary = d.ctaPrimary as DataRecord | undefined    heading: (d?.title || d?.heading || '') as string,

  }

}  const cta = d.cta as DataRecord | undefined    description: (d?.description || '') as string,



export function transformFeaturesData(data: unknown) {  const ctaSecondary = d.ctaSecondary as DataRecord | undefined    primaryCta: d?.ctaPrimary ? {

  const d = (data || {}) as DataRecord

  let features = d.features || []        text: (d.ctaPrimary as Record<string, string>).text,

  

  if (!Array.isArray(features) && typeof features === 'object') {  return {      href: (d.ctaPrimary as Record<string, string>).link

    features = Object.values(features as Record<string, unknown>).flat()

  }    badge: d.badge as string | undefined,    } : d?.cta ? {



  return {    heading: (d.title || d.heading || '') as string,      text: (d.cta as Record<string, string>).text,

    heading: d.title || d.heading,

    subheading: d.subtitle || d.subheading,    description: (d.description || '') as string,      href: (d.cta as Record<string, string>).link

    description: d.description,

    features: (Array.isArray(features) ? features : []).map((f: unknown) => {    primaryCta: ctaPrimary ? {    } : undefined,

      const feature = (f || {}) as DataRecord

      return {      text: String(ctaPrimary.text || ''),    secondaryCta: d?.ctaSecondary ? {

        icon: feature.icon,

        title: feature.title || feature.name || '',      href: String(ctaPrimary.link || '')      text: (d.ctaSecondary as Record<string, string>).text,

        description: feature.description || '',

        badge: feature.badge    } : cta ? {      href: (d.ctaSecondary as Record<string, string>).link

      }

    }),      text: String(cta.text || ''),    } : undefined,

    columns: d.columns || 3,

    backgroundColor: d.backgroundColor      href: String(cta.link || '')    stats: d?.stats as Array<{ value: string; label: string }> | undefined,

  }

}    } : undefined,    backgroundGradient: d?.backgroundGradient as string | undefined



export function transformCardsData(data: unknown) {    secondaryCta: ctaSecondary ? {  }

  const d = (data || {}) as DataRecord

  let cards = d.cards || d.services || d.posts || d.items || d.fallbackPosts || []      text: String(ctaSecondary.text || ''),}



  return {      href: String(ctaSecondary.link || '')

    heading: d.title || d.heading,

    subheading: d.subtitle || d.subheading,    } : undefined,/**

    description: d.description,

    cards: (Array.isArray(cards) ? cards : []).map((c: unknown) => {    stats: d.stats as Array<{ value: string; label: string }> | undefined, * Transform text section data from database to component format

      const card = (c || {}) as DataRecord

      const cardCta = card.cta as DataRecord    backgroundGradient: d.backgroundGradient as string | undefined */

      

      return {  }export function transformTextData(data: any): TextSectionData {

        image: card.image || card.imageUrl,

        badge: card.badge || card.category,}  return {

        title: card.title || card.name || '',

        description: card.description || card.excerpt || '',    heading: data?.title || data?.heading,

        cta: cardCta ? {

          text: String(cardCta.text || 'Learn More'),/**    subheading: data?.subtitle || data?.subheading,

          href: String(cardCta.link || cardCta.href || '#')

        } : card.link ? { * Transform text section data from database to component format    content: data?.content || data?.description || '',

          text: 'Learn More',

          href: String(card.link) */    alignment: data?.alignment,

        } : undefined,

        metadata: card.metadata || {export function transformTextData(data: unknown): TextSectionData {    maxWidth: data?.maxWidth,

          date: card.date,

          author: card.author,  const d = (data || {}) as DataRecord    backgroundColor: data?.backgroundColor,

          category: card.category

        }      textColor: data?.textColor,

      }

    }),  return {    list: data?.list || data?.items

    columns: d.columns || 3,

    cardStyle: d.cardStyle || 'elevated',    heading: (d.title || d.heading) as string | undefined,  }

    backgroundColor: d.backgroundColor,

    showImages: d.showImages !== false    subheading: (d.subtitle || d.subheading) as string | undefined,}

  }

}    content: (d.content || d.description || '') as string | string[],



export function transformTestimonialsData(data: unknown) {    alignment: d.alignment as 'left' | 'center' | 'right' | undefined,/**

  const d = (data || {}) as DataRecord

  const testimonials = d.testimonials || []    maxWidth: d.maxWidth as 'sm' | 'md' | 'lg' | 'xl' | 'full' | undefined, * Transform features section data from database to component format



  return {    backgroundColor: d.backgroundColor as string | undefined, */

    heading: d.title || d.heading,

    subheading: d.subtitle || d.subheading,    textColor: d.textColor as string | undefined,export function transformFeaturesData(data: any): FeaturesSectionData {

    description: d.description,

    testimonials: (Array.isArray(testimonials) ? testimonials : []).map((t: unknown) => {    list: (d.list || d.items) as Array<{ icon?: string; text: string }> | undefined  // Map features from database format

      const testimonial = (t || {}) as DataRecord

      return {  }  let features = data?.features || []

        quote: testimonial.quote || testimonial.text || '',

        author: testimonial.author || testimonial.name || '',}  

        role: testimonial.role || testimonial.position || '',

        company: testimonial.company,  // If features is an object with nested arrays, flatten it

        avatar: testimonial.avatar || testimonial.image,

        rating: testimonial.rating/**  if (!Array.isArray(features) && typeof features === 'object') {

      }

    }), * Transform features section data from database to component format    features = Object.values(features).flat()

    columns: d.columns || 3,

    backgroundColor: d.backgroundColor, */  }

    showRatings: d.showRatings !== false

  }export function transformFeaturesData(data: unknown): FeaturesSectionData {

}

  const d = (data || {}) as DataRecord  return {

export function transformCTAData(data: unknown) {

  const d = (data || {}) as DataRecord  let features = d.features || []    heading: data?.title || data?.heading,

  const ctaPrimary = d.ctaPrimary as DataRecord

  const cta = d.cta as DataRecord      subheading: data?.subtitle || data?.subheading,

  const ctaSecondary = d.ctaSecondary as DataRecord

    // If features is an object with nested arrays, flatten it    description: data?.description,

  return {

    heading: d.title || d.heading || '',  if (!Array.isArray(features) && typeof features === 'object') {    features: features.map((f: any) => ({

    description: d.description,

    primaryCta: ctaPrimary ? {    features = Object.values(features as Record<string, unknown>).flat()      icon: f?.icon,

      text: String(ctaPrimary.text || ''),

      href: String(ctaPrimary.link || '')  }      title: f?.title || f?.name,

    } : cta ? {

      text: String(cta.text || ''),      description: f?.description,

      href: String(cta.link || '')

    } : undefined,  return {      badge: f?.badge

    secondaryCta: ctaSecondary ? {

      text: String(ctaSecondary.text || ''),    heading: (d.title || d.heading) as string | undefined,    })),

      href: String(ctaSecondary.link || '')

    } : undefined,    subheading: (d.subtitle || d.subheading) as string | undefined,    columns: data?.columns || 3,

    backgroundColor: d.backgroundColor,

    style: d.style || 'gradient'    description: d.description as string | undefined,    backgroundColor: data?.backgroundColor

  }

}    features: (Array.isArray(features) ? features : []).map((f: unknown) => {  }


      const feature = (f || {}) as DataRecord}

      return {

        icon: feature.icon as string | undefined,/**

        title: (feature.title || feature.name || '') as string, * Transform cards section data from database to component format

        description: (feature.description || '') as string, */

        badge: feature.badge as string | undefinedexport function transformCardsData(data: any): CardsSectionData {

      }  // Handle different data structures

    }),  let cards = data?.cards || data?.services || data?.posts || data?.items || []

    columns: (d.columns as 2 | 3 | 4) || 3,  

    backgroundColor: d.backgroundColor as string | undefined  // If it's a fallback structure

  }  if (data?.fallbackPosts) {

}    cards = data.fallbackPosts

  }

/**

 * Transform cards section data from database to component format  return {

 */    heading: data?.title || data?.heading,

export function transformCardsData(data: unknown): CardsSectionData {    subheading: data?.subtitle || data?.subheading,

  const d = (data || {}) as DataRecord    description: data?.description,

  // Handle different data structures    cards: cards.map((c: any) => ({

  let cards = d.cards || d.services || d.posts || d.items || d.fallbackPosts || []      image: c?.image || c?.imageUrl,

      badge: c?.badge || c?.category,

  return {      title: c?.title || c?.name,

    heading: (d.title || d.heading) as string | undefined,      description: c?.description || c?.excerpt,

    subheading: (d.subtitle || d.subheading) as string | undefined,      cta: c?.cta ? {

    description: d.description as string | undefined,        text: c.cta.text,

    cards: (Array.isArray(cards) ? cards : []).map((c: unknown) => {        href: c.cta.link || c.cta.href

      const card = (c || {}) as DataRecord      } : c?.link ? {

      const cardCta = card.cta as DataRecord | undefined        text: 'Learn More',

              href: c.link

      return {      } : undefined,

        image: (card.image || card.imageUrl) as string | undefined,      metadata: c?.metadata || {

        badge: (card.badge || card.category) as string | undefined,        date: c?.date,

        title: (card.title || card.name || '') as string,        author: c?.author,

        description: (card.description || card.excerpt || '') as string,        category: c?.category

        cta: cardCta ? {      }

          text: String(cardCta.text || 'Learn More'),    })),

          href: String(cardCta.link || cardCta.href || '#')    columns: data?.columns || 3,

        } : card.link ? {    cardStyle: data?.cardStyle || 'elevated',

          text: 'Learn More',    backgroundColor: data?.backgroundColor,

          href: String(card.link)    showImages: data?.showImages !== false

        } : undefined,  }

        metadata: (card.metadata as Record<string, string | undefined>) || {}

          date: card.date as string | undefined,

          author: card.author as string | undefined,/**

          category: card.category as string | undefined * Transform testimonials section data from database to component format

        } */

      }export function transformTestimonialsData(data: any): TestimonialsSectionData {

    }),  const testimonials = data?.testimonials || []

    columns: (d.columns as 2 | 3 | 4) || 3,

    cardStyle: (d.cardStyle as 'elevated' | 'bordered' | 'minimal') || 'elevated',  return {

    backgroundColor: d.backgroundColor as string | undefined,    heading: data?.title || data?.heading,

    showImages: d.showImages !== false    subheading: data?.subtitle || data?.subheading,

  }    description: data?.description,

}    testimonials: testimonials.map((t: any) => ({

      quote: t?.quote || t?.text,

/**      author: t?.author || t?.name,

 * Transform testimonials section data from database to component format      role: t?.role || t?.position,

 */      company: t?.company,

export function transformTestimonialsData(data: unknown): TestimonialsSectionData {      avatar: t?.avatar || t?.image,

  const d = (data || {}) as DataRecord      rating: t?.rating

  const testimonials = d.testimonials || []    })),

    columns: data?.columns || 3,

  return {    backgroundColor: data?.backgroundColor,

    heading: (d.title || d.heading) as string | undefined,    showRatings: data?.showRatings !== false

    subheading: (d.subtitle || d.subheading) as string | undefined,  }

    description: d.description as string | undefined,}

    testimonials: (Array.isArray(testimonials) ? testimonials : []).map((t: unknown) => {

      const testimonial = (t || {}) as DataRecord/**

      return { * Transform CTA section data from database to component format

        quote: (testimonial.quote || testimonial.text || '') as string, */

        author: (testimonial.author || testimonial.name || '') as string,export function transformCTAData(data: any): CTASectionData {

        role: (testimonial.role || testimonial.position || '') as string,  return {

        company: testimonial.company as string | undefined,    heading: data?.title || data?.heading || '',

        avatar: (testimonial.avatar || testimonial.image) as string | undefined,    description: data?.description,

        rating: testimonial.rating as number | undefined    primaryCta: data?.ctaPrimary ? {

      }      text: data.ctaPrimary.text,

    }),      href: data.ctaPrimary.link

    columns: (d.columns as 1 | 2 | 3) || 3,    } : data?.cta ? {

    backgroundColor: d.backgroundColor as string | undefined,      text: data.cta.text,

    showRatings: d.showRatings !== false      href: data.cta.link

  }    } : undefined,

}    secondaryCta: data?.ctaSecondary ? {

      text: data.ctaSecondary.text,

/**      href: data.ctaSecondary.link

 * Transform CTA section data from database to component format    } : undefined,

 */    backgroundColor: data?.backgroundColor,

export function transformCTAData(data: unknown): CTASectionData {    style: data?.style || 'gradient'

  const d = (data || {}) as DataRecord  }

  const ctaPrimary = d.ctaPrimary as DataRecord | undefined}

  const cta = d.cta as DataRecord | undefined

  const ctaSecondary = d.ctaSecondary as DataRecord | undefined/**

   * Auto-transform based on section type

  return { */

    heading: (d.title || d.heading || '') as string,export function transformSectionData(sectionType: string, data: any): any {

    description: d.description as string | undefined,  switch (sectionType) {

    primaryCta: ctaPrimary ? {    case 'hero':

      text: String(ctaPrimary.text || ''),      return transformHeroData(data)

      href: String(ctaPrimary.link || '')    case 'text':

    } : cta ? {    case 'text-image':

      text: String(cta.text || ''),      return transformTextData(data)

      href: String(cta.link || '')    case 'features':

    } : undefined,      return transformFeaturesData(data)

    secondaryCta: ctaSecondary ? {    case 'cards':

      text: String(ctaSecondary.text || ''),    case 'blog-preview':

      href: String(ctaSecondary.link || '')      return transformCardsData(data)

    } : undefined,    case 'testimonials':

    backgroundColor: d.backgroundColor as string | undefined,      return transformTestimonialsData(data)

    style: (d.style as 'gradient' | 'solid' | 'minimal') || 'gradient'    case 'cta':

  }      return transformCTAData(data)

}    default:

      return data

/**  }

 * Auto-transform based on section type}

 */
export function transformSectionData(sectionType: string, data: unknown): unknown {
  switch (sectionType) {
    case 'hero':
      return transformHeroData(data)
    case 'text':
    case 'text-image':
      return transformTextData(data)
    case 'features':
      return transformFeaturesData(data)
    case 'cards':
    case 'blog-preview':
      return transformCardsData(data)
    case 'testimonials':
      return transformTestimonialsData(data)
    case 'cta':
      return transformCTAData(data)
    default:
      return data
  }
}
