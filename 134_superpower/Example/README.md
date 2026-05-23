# Super Pipe Bros

A vanilla-JS Mario clone built as a learning project.

## Run

Because the game uses ES modules, you need to serve via HTTP (not `file://`):

```bash
# Option 1: any static server
npx serve .

# Option 2: with XAMPP — put folder under htdocs/, open http://localhost/.../index.html
```

Then open the URL in your browser.

## Controls

| Key | Action |
|---|---|
| ← / → / A / D | Move |
| Space / W / ↑ | Jump |
| Shift | Run |
| X / J | Shoot fireball (Fire Mario) |
| Enter | Start / Confirm |
| Esc | Pause |
| R | Retry (Game Over) |
| Q | Quit to menu |
| M | Mute |

## Test

```bash
npm install
npm test
```
