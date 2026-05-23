import { createGame } from './game.js';

const canvas = document.getElementById('game');
const { start } = createGame(canvas);
start();
