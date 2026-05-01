import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

const BulletList: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1='9' y1='6' x2='20' y2='6' />
    <line x1='9' y1='12' x2='20' y2='12' />
    <line x1='9' y1='18' x2='20' y2='18' />
    <circle cx='5' cy='6' r='1' fill='currentColor' />
    <circle cx='5' cy='12' r='1' fill='currentColor' />
    <circle cx='5' cy='18' r='1' fill='currentColor' />
  </svg>
);

const Bold: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z' />
  </svg>
);

const Callout: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M4 3h16v13H8l-4 4v-4H4V3z' />
    <path d='M6.8 8.5H13' />
    <path d='M6.8 11.5h9.4' />
  </svg>
);

const Code: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points='16 18 22 12 16 6' />
    <polyline points='8 6 2 12 8 18' />
  </svg>
);

const Heading1: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M4 6v12M12 6v12M4 12h8M16 9l3-2v11' />
  </svg>
);

const Heading2: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M4 6v12M11 6v12M4 12h7M14 10a3 3 0 0 1 6 0c0 3-6 5-6 8h6' />
  </svg>
);

const Heading3: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M4 6v12M11 6v12M4 12h7M14 8h6l-3 4a3 3 0 1 1-3 3' />
  </svg>
);

const Image: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x='3' y='4' width='18' height='14' rx='1' />
    <path d='M7 9l2 2 2-2 4 4 3-3' />
    <circle cx='9' cy='9' r='1.5' />
    <path d='M3 17l4-4 3 2 6-5 4 5' />
  </svg>
);

const Italic: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1='14' y1='5' x2='19' y2='5' />
    <line x1='5' y1='19' x2='10' y2='19' />
    <line x1='15' y1='5' x2='9' y2='19' />
  </svg>
);

const Math: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1='4' y1='12' x2='20' y2='12' />
    <path d='M7 6l-3 6 3 6' />
    <path d='M17 6l3 6-3 6' />
    <path d='M10 8h4' />
    <path d='M10 16h4' />
  </svg>
);

const OrderedList: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1='10' y1='6' x2='20' y2='6' />
    <line x1='10' y1='12' x2='20' y2='12' />
    <line x1='10' y1='18' x2='20' y2='18' />
    <path d='M4 6h2v0M4 4l2-1v3M4 11h2l-2 2h2M4 17h2v1H4v1h2v1H4' />
  </svg>
);

const Strike: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1='4' y1='12' x2='20' y2='12' />
    <path d='M16 6a4 4 0 0 0-4-2c-2.5 0-4 1.5-4 3.5 0 1.5 1 2.5 3 3.5' />
    <path d='M8 18a4 4 0 0 0 4 2c2.5 0 4-1.5 4-3.5 0-1.5-1-2.5-3-3.5' />
  </svg>
);

export const SLASH_MENU_ICONS: Readonly<Record<string, ComponentType<IconProps>>> = Object.freeze({
  bold: Bold,
  italic: Italic,
  strike: Strike,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  bulletList: BulletList,
  orderedList: OrderedList,
  taskList: BulletList,
  callout: Callout,
  code: Code,
  math: Math,
  image: Image,
});
