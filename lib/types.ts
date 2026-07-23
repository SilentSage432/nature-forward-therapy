export type ProcessStep = {
  title: string;
  description: string;
};

export type SiteContent = {
  profile: {
    id: string;
    name: string;
    credentials: string;
    location: string;
    tagline: string;
    bio: string;
    bioHighlight: string;
    headshotPath: string;
    headwayUrl: string;
    psychologyTodayUrl: string;
    heroBackgroundUrl: string;
    aboutImageUrl: string;
    specialtiesImageUrl: string;
    contactImageUrl: string;
    footerCredit: string;
  };
  specialties: Array<{
    id: string;
    title: string;
    icon: string;
    description: string;
    sortOrder: number;
  }>;
  focusTags: Array<{
    id: string;
    label: string;
    sortOrder: number;
  }>;
  practice: {
    id: string;
    expertise: string[];
    paymentMethods: string[];
    insurances: string[];
    therapyTypes: string[];
    processSteps: ProcessStep[];
  };
  site: {
    siteTitle: string;
    siteDescription: string;
  };
};

export const FALLBACK_CONTENT: SiteContent = {
  profile: {
    id: "fallback",
    name: "Nicole Garcia",
    credentials: "LCSW-C",
    location: "Towson, MD 21286",
    tagline: "Compassionate care for life's transitions. Helping you find balance in a chaotic world.",
    bio: "Welcome. I provide a safe, non-judgmental space in Towson, MD, to help you navigate your mental health journey. My approach is person-centered, focusing on evidence-based strategies to foster growth and resilience.",
    bioHighlight:
      "focusing on holistic wellness—honoring the connection between mind, body, and environment as you move toward balance and clarity.",
    headshotPath: "/images/nicole.jpg",
    headwayUrl:
      "https://care.headway.co/providers/nicole-garcia-5?utm_source=pem&utm_medium=direct_link&utm_campaign=191873",
    psychologyTodayUrl: "https://share.google/fnqjdCLYmiedRj42E",
    heroBackgroundUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
    aboutImageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    specialtiesImageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1200&q=80",
    contactImageUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    footerCredit: "Powered by SAGE Federation",
  },
  specialties: [
    {
      id: "1",
      title: "Anxiety & Stress",
      icon: "🌿",
      description: "Helping you find calm in the chaos of modern life.",
      sortOrder: 0,
    },
    {
      id: "2",
      title: "Life Transitions",
      icon: "🪨",
      description: "Support for career changes, relationship shifts, and identity growth.",
      sortOrder: 1,
    },
    {
      id: "3",
      title: "Clinical Support",
      icon: "🌱",
      description: "Dedicated expertise in Clinical Social Work and therapeutic intervention.",
      sortOrder: 2,
    },
  ],
  focusTags: [
    { id: "1", label: "Trauma", sortOrder: 0 },
    { id: "2", label: "ADHD", sortOrder: 1 },
    { id: "3", label: "Depression", sortOrder: 2 },
    { id: "4", label: "Anxiety", sortOrder: 3 },
  ],
  practice: {
    id: "fallback",
    expertise: [
      "Behavioral Issues",
      "Body Image",
      "Caregivers",
      "Codependency",
      "Coping Skills",
      "Grief",
      "Developmental Disorders",
      "Divorce",
      "Life Transitions",
      "Obsessive-Compulsive (OCD)",
      "Parenting",
      "Peer Relationships",
    ],
    paymentMethods: ["American Express", "Discover", "Mastercard", "Visa"],
    insurances: [
      "Aetna",
      "Ascension",
      "BlueCross and BlueShield",
      "CareFirst",
      "Carelon Behavioral Health",
      "Cigna and Evernorth",
      "Kaiser (Out-of-Network)",
      "Medicaid",
      "Quest Behavioral Health",
    ],
    therapyTypes: [
      "Cognitive Behavioral (CBT)",
      "Compassion Focused",
      "Culturally Sensitive",
      "Expressive Arts",
      "Family / Marital",
      "Family Systems",
      "Feminist",
      "Multicultural",
      "Person-Centered",
      "Psychoanalytic",
      "Psychodynamic",
      "Trauma Focused",
    ],
    processSteps: [
      {
        title: "Initial Consultation",
        description: "We begin with a conversation to understand your needs.",
      },
      {
        title: "Collaborative Goal Setting",
        description: "Together we define what success looks like for you.",
      },
      {
        title: "Consistent Support",
        description: "Ongoing, evidence-based care tailored to your journey.",
      },
    ],
  },
  site: {
    siteTitle: "Nicole Garcia, LCSW-C | Nature-Forward Therapy | Towson, MD",
    siteDescription:
      "Nicole Garcia, LCSW-C – Clinical Social Work & Therapy in Towson, MD. Compassionate care for life's transitions.",
  },
};
