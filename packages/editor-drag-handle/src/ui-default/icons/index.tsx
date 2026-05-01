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

const DragHandle: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx='12' cy='5' r='1' />
    <circle cx='12' cy='9' r='1' />
    <circle cx='12' cy='13' r='1' />
    <circle cx='12' cy='17' r='1' />
  </svg>
);

const Duplicate: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x='8' y='8' width='10' height='10' rx='2' />
    <path d='M6 6h10v10' />
    <path d='M9 3h10v10' />
  </svg>
);

const Delete: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M7 8h10' />
    <path d='M10 8v8' />
    <path d='M14 8v8' />
    <rect x='5' y='7' width='14' height='12' rx='2' />
    <path d='M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
  </svg>
);

const MoveUp: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M12 4v12' />
    <path d='M8 8l4-4 4 4' />
    <path d='M8 12l4-4 4 4' />
  </svg>
);

const MoveDown: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M12 4v12' />
    <path d='M8 12l4 4 4-4' />
    <path d='M8 16l4-4 4 4' />
  </svg>
);

const SelectBlock: ComponentType<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d='M5 6l7 0l-3 3l3-3l1.4 1.4L12 11.8L5 4.4z' />
    <path d='M5 18h14' />
    <path d='M5 18h14' />
  </svg>
);

export const DRAG_HANDLE_ICONS: Readonly<Record<string, ComponentType<IconProps>>> =
  Object.freeze({
    'duplicate': Duplicate,
    'delete': Delete,
    'move-up': MoveUp,
    'move-down': MoveDown,
    'select-block': SelectBlock,
    'drag-handle': DragHandle,
  });
