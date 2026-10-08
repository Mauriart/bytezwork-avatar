# BytezWork Avatar

Una arañita constructora interactiva: cuerpo redondo negro, ojos blancos expresivos, cuatro patitas, casco blanco, cinturón sencillo y patitas inferiores cortas y gorditas.

Las cuatro patitas se mueven suavemente en reposo y con más energía al trabajar o celebrar. Se detienen al dormir o activar movimiento reducido. Este avatar no lleva planos ni lápiz.

Primera versión en SVG basada en el motor de Agent Robot Avatar. Mantiene el parpadeo, seguimiento del cursor, expresiones, arrastre elástico, estados de espera y preferencias de movimiento reducido.

## Probar la demo

```bash
npm ci
npm run dev
```

Abrí `http://localhost:4173/demo/bytezwork.html`. La demo original del robot sigue disponible en `/demo/index.html`.

## Ajustar el diseño

La demo incluye barras independientes para ojos, casco, largo y grosor de manos y pies, además del tamaño general. Los cambios se aplican al instante, se guardan en este navegador y se pueden compartir con **Copiar ajustes**. **Restablecer** vuelve al diseño inicial.

El fondo cuadriculado y el brillo pertenecen a la demo.

Los atributos del componente admiten los mismos valores:

| Atributo | Valor inicial | Rango |
| --- | --- | --- |
| `eye-size` | 100 | 40–140 % |
| `helmet-size` | 90 | 55–110 % |
| `arm-length` | 100 | 60–140 % |
| `leg-length` | 100 | 60–160 % |
| `arm-thickness` | 32 | 12–44 unidades SVG |
| `leg-thickness` | 32 | 12–44 unidades SVG |

Ojos y casco se escalan respecto al dibujo original. El largo de las patitas se escala respecto a sus curvas iniciales; el grosor es independiente. Los valores se limitan al rango y los vacíos o inválidos usan el valor inicial. Los atributos se pueden cambiar durante una animación.

## Integración

```html
<script type="module" src="./bytezwork-avatar.js"></script>
<bytezwork-avatar size="180" motion="auto"></bytezwork-avatar>
```

```js
const avatar = document.querySelector('bytezwork-avatar');
avatar.startWaiting();
await avatar.play('success');
avatar.reset();
```

El componente hereda la API original: `play`, `reset`, `startWaiting`, `stopWaiting`, `setPointerFollow`, atributos `size`, `color`, `auto-sleep`, `wake-on` y `motion`, y eventos `face-state` y `action-state`.

La antena del robot se oculta en la arañita. Las opciones específicas de la antena no tienen efecto visual en este personaje. El color modifica el cuerpo y las patitas; el casco permanece blanco.

## Desarrollo y validación

```bash
npm test
npm run build:pages
```

El build de Pages coloca la arañita en `index.html` y conserva la demo original en `robot.html`. El workflow de Pages del fork requiere configurar GitHub Pages con GitHub Actions en el repositorio antes de publicar.

La ilustración es una primera interpretación vectorial del concepto de BytezWork; las otras tres variantes (laptop, teléfono y herramientas) quedan para una siguiente iteración.

## Licencia y origen

El motor deriva de [Agent Robot Avatar de CX ArtLab](https://github.com/CX-ArtLab/agent-robot-avatar). Se conserva su licencia MIT y aviso de copyright en [LICENSE](./LICENSE). La arañita y la identidad BytezWork corresponden al diseño de este proyecto; no se atribuye a BytezWork la identidad visual del robot original.
