export function calcTarget(origW, origH, cfg) {
    // cfg = { mode, width, height, keepAspect, allowUpscale, scalePct }
    if (!cfg) cfg = {};
    if (cfg.mode === 'scale') {
        const s = Math.max(0.01, (cfg.scalePct || 100) / 100);
        return { w: Math.max(1, Math.round(origW * s)), h: Math.max(1, Math.round(origH * s)) };
    }
    if (cfg.mode === 'width') {
        let w = cfg.width || origW;
        if (!cfg.allowUpscale) w = Math.min(w, origW);
        const h = cfg.keepAspect ? Math.round(origH * (w / origW)) : (cfg.height || origH);
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }
    if (cfg.mode === 'height') {
        let h = cfg.height || origH;
        if (!cfg.allowUpscale) h = Math.min(h, origH);
        const w = cfg.keepAspect ? Math.round(origW * (h / origH)) : (cfg.width || origW);
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }
    // fit
    const maxW = cfg.width || origW;
    const maxH = cfg.height || origH;
    if (cfg.keepAspect === false) {
        return { w: Math.min(origW, maxW), h: Math.min(origH, maxH) };
    } else {
        const ratioBase = Math.min(maxW / origW, maxH / origH);
        const ratio = cfg.allowUpscale ? ratioBase : Math.min(ratioBase, 1);
        return { w: Math.max(1, Math.round(origW * ratio)), h: Math.max(1, Math.round(origH * ratio)) };
    }
}

export function mimeToExt(mime) {
    if (!mime) return '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
    if (mime.includes('png')) return '.png';
    if (mime.includes('webp')) return '.webp';
    if (mime.includes('gif')) return '.gif';
    return '.png';
}

// convert small dataURL -> Blob (useful to test fallback)
export function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    if (parts.length < 2) return null;
    const meta = parts[0];
    const base64 = parts[1];
    const m = meta.match(/:(.*?);/);
    const mime = m ? m[1] : 'image/png';
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return new Blob([u8], { type: mime });
}

// small helper to build an output filename used by app
export function buildOutputName(originalName, w, h, mime) {
    const ext = mimeToExt(mime);
    const nameNoExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameNoExt}_${w}x${h}${ext}`;
}