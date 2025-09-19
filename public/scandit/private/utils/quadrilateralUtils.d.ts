/// <reference types="emscripten" />
import { Quadrilateral } from '../../Common.js';
import '../Serializable.js';

declare function calculateWidth(quadrilateral: Quadrilateral): number;
declare function calculateHeight(quadrilateral: Quadrilateral): number;
declare function calculateArea(quadrilateral: Quadrilateral): number;

export { calculateArea, calculateHeight, calculateWidth };
