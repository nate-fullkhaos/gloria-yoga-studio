export const SOCIAL_LINKS = {
  gloriaInstagram: {
    handle: "@psyyogi",
    url: "https://www.instagram.com/psyyogi/",
    label: "Follow Gloria on Instagram"
  },
  brandInstagram: {
    handle: "@psyyogshala",
    url: "https://www.instagram.com/psyyogshala/",
    label: "Psy Yogshala Instagram"
  },
  youtube: {
    handle: "@psyyogshala",
    url: "https://www.youtube.com/@psyyogshala",
    label: "Psy Yogshala YouTube Channel"
  },
  whatsapp: {
    title: "Psy Yogshala WhatsApp Community",
    url: "https://chat.whatsapp.com/G9WwOKYK3ZZ2syPwsGCQZx",
    label: "Join WhatsApp Community"
  },
  email: {
    address: "psyyogshala@gmail.com",
    url: "mailto:psyyogshala@gmail.com",
    label: "Send us an Email"
  }
};

export const COMMUNITY_CARDS = [
  {
    key: "whatsapp",
    highlight: true,
    badge: "Direct Updates",
    icon: "message-circle",
    title: "WhatsApp Community",
    detail: "Join our daily yoga community for updates, announcements, and practice schedules.",
    action: "Join Community",
    href: SOCIAL_LINKS.whatsapp.url,
    label: SOCIAL_LINKS.whatsapp.label
  },
  {
    key: "email",
    icon: "mail",
    title: "Email Us",
    detail: SOCIAL_LINKS.email.address,
    action: "Send Message",
    href: SOCIAL_LINKS.email.url,
    label: SOCIAL_LINKS.email.label
  },
  {
    key: "instagram",
    icon: "instagram",
    title: "Instagram",
    detail: SOCIAL_LINKS.brandInstagram.handle,
    action: "Follow Us",
    href: SOCIAL_LINKS.brandInstagram.url,
    label: SOCIAL_LINKS.brandInstagram.label
  },
  {
    key: "youtube",
    icon: "youtube",
    title: "YouTube",
    detail: SOCIAL_LINKS.youtube.handle,
    action: "Subscribe",
    href: SOCIAL_LINKS.youtube.url,
    label: SOCIAL_LINKS.youtube.label
  }
];

export const FOOTER_SOCIALS = [
  {
    key: "instagram",
    icon: "instagram",
    href: SOCIAL_LINKS.brandInstagram.url,
    label: `${SOCIAL_LINKS.brandInstagram.label} (${SOCIAL_LINKS.brandInstagram.handle})`
  },
  {
    key: "youtube",
    icon: "youtube",
    href: SOCIAL_LINKS.youtube.url,
    label: `${SOCIAL_LINKS.youtube.label} (${SOCIAL_LINKS.youtube.handle})`
  },
  {
    key: "email",
    icon: "mail",
    href: SOCIAL_LINKS.email.url,
    label: `${SOCIAL_LINKS.email.label} (${SOCIAL_LINKS.email.address})`
  }
];