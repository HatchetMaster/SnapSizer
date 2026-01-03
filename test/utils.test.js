import { describe, it, expect } from 'vitest';
import { calcTarget, mimeToExt, dataURLtoBlob, buildOutputName } from '../src/utils';

describe('calcTarget', () => {
    it('fit clamps down, not up by default', () => {
        const origW = 2000, origH = 1000;
        const cfg = { mode: 'fit', width: 1000, height: 800, keepAspect: true, allowUpscale: false };
        const t = calcTarget(origW, origH, cfg);
        expect(t.w).toBeLessThanOrEqual(origW);
        expect(t.w).toBe(1000);
    });

    it('width mode respects aspect and prevents upscaling by default', () => {
        const t1 = calcTarget(500, 400, { mode: 'width', width: 200, keepAspect: true, allowUpscale: false });
        expect(t1.w).toBe(200);
        expect(t1.h).toBe(Math.round(400 * (200 / 500)));
        const t2 = calcTarget(500, 400, { mode: 'width', width: 1200, keepAspect: true, allowUpscale: false });
        expect(t2.w).toBe(500);
    });

    it('allows upscaling when flag is true', () => {
        const t = calcTarget(400, 300, { mode: 'scale', scalePct: 200, keepAspect: true, allowUpscale: true });
        expect(t.w).toBe(800);
        expect(t.h).toBe(600);
    });

    it('height mode clamps correctly', () => {
        const t = calcTarget(800, 600, { mode: 'height', height: 300, keepAspect: true });
        expect(t.h).toBe(300);
        expect(t.w).toBe(Math.round(800 * (300 / 600)));
    });
});

describe('mimeToExt', () => {
    it('maps common mimes', () => {
        expect(mimeToExt('image/jpeg')).toBe('.jpg');
        expect(mimeToExt('image/png')).toBe('.png');
        expect(mimeToExt('image/webp')).toBe('.webp');
        expect(mimeToExt('image/gif')).toBe('.gif');
        expect(mimeToExt(undefined)).toBe('.png');
    });
});

describe('dataURLtoBlob', () => {
    it('converts a tiny dataURL to a Blob', () => {
        // 1x1 red png dataURL
        const dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==';
        const b = dataURLtoBlob(dataURL);
        expect(b).not.toBeNull();
        expect(b.type).toBe('image/png');
        expect(b.size).toBeGreaterThan(0);
    });
});

describe('buildOutputName', () => {
    it('generates correct filename', () => {
        const out = buildOutputName('photo.jpg', 800, 600, 'image/jpeg');
        expect(out).toBe('photo_800x600.jpg');
    });
});