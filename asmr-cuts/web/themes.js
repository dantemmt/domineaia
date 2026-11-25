// Temas: cada objeto que pode ser cortado.
// shape.scale = raios (x, y, z); shape.exp = [e1, e2] superquádrica (2,2 = elipsoide; 6,6 = caixa arredondada; 2,8 = cilindro)
// shape.taper = afina o topo (negativo) ou a base (positivo)
// skin.pattern: speckle | stripes | dimple | blush | fuzzy | swirl | plain
// layers: camadas de fora para dentro (r = raio relativo onde a camada começa)
// cap.pattern: plain | segments | seeds | seedring | swirl | holes
export const THEMES = {
  abacate: {
    name: { pt: 'Abacate', en: 'Avocado' },
    shape: { scale: [0.95, 1.28, 0.95], exp: [2, 2], taper: -0.16 },
    skin: { c1: '#2c4a1c', c2: '#15260c', pattern: 'speckle', shine: 0.45, scale: 9 },
    layers: [ { r: 1.0, c: '#2f5418' }, { r: 0.965, c: '#a9c444' }, { r: 0.86, c: '#e6e58e' } ],
    core: { scale: [0.4, 0.46, 0.4], off: [0, -0.2, 0], c: '#7b4526', shine: 0.7 },
    cap: { pattern: 'plain', alt: '#e6e58e', shine: 0.55 },
  },
  melancia: {
    name: { pt: 'Melancia', en: 'Watermelon' },
    shape: { scale: [1.3, 1.08, 1.08], exp: [2, 2], taper: 0 },
    skin: { c1: '#1f5a1f', c2: '#9cc46a', pattern: 'stripes', shine: 0.6, scale: 4 },
    layers: [ { r: 1.0, c: '#2e6e2a' }, { r: 0.955, c: '#eef5cf' }, { r: 0.88, c: '#f23d55' } ],
    cap: { pattern: 'seeds', alt: '#1a120e', shine: 0.75 },
  },
  laranja: {
    name: { pt: 'Laranja', en: 'Orange' },
    shape: { scale: [1.08, 1.0, 1.08], exp: [2, 2], taper: 0 },
    skin: { c1: '#f68a17', c2: '#e2700c', pattern: 'dimple', shine: 0.55, scale: 14 },
    layers: [ { r: 1.0, c: '#f59a24' }, { r: 0.94, c: '#fff0d4' }, { r: 0.885, c: '#ffa133' } ],
    core: { scale: [0.07, 1.0, 0.07], off: [0, 0, 0], c: '#fff3dc', shine: 0.3 },
    cap: { pattern: 'segments', alt: '#fff2db', shine: 0.8, segments: 10 },
  },
  limao: {
    name: { pt: 'Limão', en: 'Lemon' },
    shape: { scale: [0.95, 1.25, 0.95], exp: [2, 1.55], taper: 0 },
    skin: { c1: '#f6dc2c', c2: '#e6c514', pattern: 'dimple', shine: 0.6, scale: 16 },
    layers: [ { r: 1.0, c: '#f2d22e' }, { r: 0.93, c: '#fffbe4' }, { r: 0.88, c: '#f6ea7c' } ],
    core: { scale: [0.06, 1.0, 0.06], off: [0, 0, 0], c: '#fffbe4', shine: 0.3 },
    cap: { pattern: 'segments', alt: '#fffbea', shine: 0.85, segments: 9 },
  },
  kiwi: {
    name: { pt: 'Kiwi', en: 'Kiwi' },
    shape: { scale: [0.95, 1.25, 0.95], exp: [2, 2], taper: 0.05 },
    skin: { c1: '#7d5b34', c2: '#56401f', pattern: 'fuzzy', shine: 0.15, scale: 10 },
    layers: [ { r: 1.0, c: '#5f6a26' }, { r: 0.975, c: '#78bf3e' } ],
    core: { scale: [0.22, 0.6, 0.22], off: [0, 0, 0], c: '#f1efc4', shine: 0.4 },
    cap: { pattern: 'seedring', alt: '#160f08', shine: 0.75 },
  },
  tomate: {
    name: { pt: 'Tomate', en: 'Tomato' },
    shape: { scale: [1.12, 0.92, 1.12], exp: [2, 2.2], taper: 0 },
    skin: { c1: '#e2261b', c2: '#b8160f', pattern: 'blush', shine: 0.95, scale: 3 },
    layers: [ { r: 1.0, c: '#d8261a' }, { r: 0.9, c: '#f0503a' } ],
    cap: { pattern: 'segments', alt: '#f7a06a', shine: 0.9, segments: 4 },
  },
  ovo: {
    name: { pt: 'Ovo cozido', en: 'Boiled egg' },
    shape: { scale: [0.88, 1.15, 0.88], exp: [2, 2], taper: -0.13 },
    skin: { c1: '#f6f1e6', c2: '#e9e1d0', pattern: 'plain', shine: 0.55, scale: 5 },
    layers: [ { r: 1.0, c: '#fbf8f0' } ],
    core: { scale: [0.46, 0.5, 0.46], off: [0, -0.08, 0], c: '#f6b326', shine: 0.25 },
    cap: { pattern: 'plain', alt: '#fbf8f0', shine: 0.5 },
  },
  sabao: {
    name: { pt: 'Sabonete', en: 'Soap' },
    shape: { scale: [1.2, 0.72, 0.82], exp: [5, 5], taper: 0 },
    skin: { c1: '#ff9ec8', c2: '#ffc7df', pattern: 'swirl', shine: 0.85, scale: 2.2 },
    layers: [ { r: 1.0, c: '#ff9ec8' } ],
    cap: { pattern: 'swirl', alt: '#ffffff', shine: 0.5 },
  },
  queijo: {
    name: { pt: 'Queijo', en: 'Cheese' },
    shape: { scale: [1.2, 0.62, 1.2], exp: [2, 8], taper: 0 },
    skin: { c1: '#e3a531', c2: '#d4912a', pattern: 'dimple', shine: 0.4, scale: 6 },
    layers: [ { r: 1.0, c: '#d99a33' }, { r: 0.96, c: '#f8dc78' } ],
    cap: { pattern: 'holes', alt: '#c9a447', shine: 0.35 },
  },
};
