export type MenuItem = {
  name: string;
  desc: string;
  price: string;
  signature?: boolean;
};

export type MenuAct = {
  numeral: string;
  title: string;
  items: MenuItem[];
};

export const menu: MenuAct[] = [
  {
    numeral: "ACT I",
    title: "COFFEE",
    items: [
      { name: "Espresso", desc: "single origin, double shot", price: "180" },
      { name: "Americano", desc: "espresso, hot water, room for thought", price: "220" },
      { name: "Flat White", desc: "espresso, silky milk, no foam theatrics", price: "320" },
      { name: "Cappuccino", desc: "espresso, milk, crown of foam", price: "320" },
      { name: "Cortado", desc: "equal parts espresso and warm milk", price: "300" },
      { name: "Cold Brew", desc: "steeped 18 hours, served over ice", price: "340" },
      { name: "Iced Latte", desc: "double shot, cold milk, ice", price: "360" },
      { name: "Iced Pistachio Latte", desc: "house pistachio, espresso, oat", price: "420" },
    ],
  },
  {
    numeral: "ACT II",
    title: "FRAPPES",
    items: [
      { name: "Mocha Frappe", desc: "espresso, dark chocolate, cream", price: "440" },
      { name: "Caramel Frappe", desc: "house caramel, espresso, milk", price: "440" },
      { name: "Hazelnut Frappe", desc: "toasted hazelnut, espresso", price: "440" },
      { name: "Pistachio Frappe", desc: "house pistachio, espresso, milk", price: "460" },
    ],
  },
  {
    numeral: "ACT III",
    title: "THE TABLE",
    items: [
      { name: "Butter Croissant", desc: "laminated by hand, salted butter", price: "320" },
      { name: "Almond Croissant", desc: "frangipane, toasted almonds, sugar", price: "380" },
      { name: "Egg & Cheese Sandwich", desc: "soft scramble, cheddar, milk bun", price: "560" },
      { name: "Chicken Pesto Sandwich", desc: "pulled chicken, basil pesto, sourdough", price: "680" },
      { name: "Tab Fries", desc: "skin on, rosemary salt, garlic aioli", price: "420" },
      { name: "Toasted Granola Bowl", desc: "yogurt, seasonal fruit, honey", price: "520" },
    ],
  },
  {
    numeral: "ACT IV",
    title: "SIGNATURES",
    items: [
      { name: "Pistachio Latte", desc: "the reason a lot of people show up", price: "280–420", signature: true },
      { name: "Tab Cookie", desc: "brown butter, dark chocolate, baked daily", price: "240", signature: true },
      { name: "Tab Set Combo", desc: "any coffee, any croissant, one cookie", price: "780", signature: true },
    ],
  },
];

export const descriptors = [
  "your new regular",
  "trust us",
  "you'll order this twice",
  "the right call",
  "ask the regulars",
  "made for slow mornings",
  "no notes",
  "you came for this",
];
