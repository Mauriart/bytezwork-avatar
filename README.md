# BytezWork Avatar

Una arañita constructora interactiva: cuerpo redondo negro, ojos blancos expresivos, cuatro patitas, casco blanco, cinturón sencillo, planos y lápiz.

Primera versión en SVG basada en el motor de Agent Robot Avatar. Mantiene el parpadeo, seguimiento del cursor, expresiones, arrastre elástico, estados de espera y preferencias de movimiento reducido.

## Probar la demo

```bash
npm ci
npm run dev
```

Abrí `http://localhost:4173/demo/bytezwork.html`. La demo original del robot sigue disponible en `/demo/index.html`.

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
