window.scriptLoaded = true;
console.log('script.js loaded');

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const thumbs = document.getElementById('thumbs');
const status = document.getElementById('status');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const modeEl = document.getElementById('mode');
const widthEl = document.getElementById('width');
const heightEl = document.getElementById('height');
const keepAspectEl = document.getElementById('keepAspect');
const scaleControls = document.getElementById('scaleControls');
const sizeControls = document.getElementById('sizeControls');
const scalePctEl = document.getElementById('scalePct');
const formatEl = document.getElementById('format');
const qualityEl = document.getElementById('quality');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let files = []; 
let zipAvailable = typeof JSZip !== 'undefined';

function setStatus(msg, isError = false) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = msg;
    if (isError) console.error(msg);
    else console.log(msg);
}

function prevent(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { prevent(e); dropZone.classList.add('drag'); });
});
['dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { prevent(e); dropZone.classList.remove('drag'); });
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

dropZone.addEventListener('drop', (e) => {
    prevent(e);
    const dt = e.dataTransfer;
    if (dt && dt.files) handleFiles(dt.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

async function handleFiles(fileList) {
    try {
        const incoming = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
        if (!incoming.length) { setStatus('No image files found in selection', true); return; }
        setStatus(`Loading ${incoming.length} image(s)...`);
        for (const f of incoming) {
            await loadImageFile(f);
        }
        setStatus(`${files.length} image(s) ready`);
    } catch (err) {
        console.error('handleFiles error', err);
        setStatus('Error loading files (check console)', true);
    }
}

function loadImageFile(f) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onerror = (ev) => { console.error('FileReader error', ev); setStatus('File read error', true); reject(ev); };
            reader.onload = (ev) => {
                const url = ev.target.result;
                const img = new Image();
                img.onload = () => {
                    const intrinsicW = img.naturalWidth || img.width;
                    const intrinsicH = img.naturalHeight || img.height;
                    console.log(`Loaded ${f.name}: natural ${intrinsicW}×${intrinsicH}`);
                    const item = {
                        file: f,
                        name: f.name,
                        origWidth: intrinsicW,
                        origHeight: intrinsicH,
                        img,
                        outputBlob: null,
                        outputName: null,
                    };
                    files.push(item);
                    renderThumbs();
                    resolve(item);
                };
                img.onerror = (err) => {
                    console.error('Image decode error', err);
                    setStatus(`Failed to decode image ${f.name}`, true);
                    reject(err);
                };
                img.src = url;
            };
            reader.readAsDataURL(f);
        } catch (err) {
            reject(err);
        }
    });
}

// Helper to close any open menus
function closeAllMenus() {
    const lists = document.querySelectorAll('.menu-list.show');
    lists.forEach(l => l.classList.remove('show'));
}

// Close menus when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.thumb')) closeAllMenus();
});

// keyboard: close on Escape globally
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
});

function renderThumbs() {
    thumbs.innerHTML = '';
    files.forEach((it, idx) => {
        const div = document.createElement('div');
        div.className = 'thumb';
        div.setAttribute('data-idx', idx);

        const img = document.createElement('img');
        img.src = it.img.src;
        img.alt = it.name;
        img.tabIndex = 0;

        const fname = document.createElement('div');
        fname.className = 'fname';
        fname.textContent = it.name;

        const meta = document.createElement('div');
        meta.className = 'fmeta';
        meta.textContent = `${it.origWidth}×${it.origHeight}`;

        // Menu button (single)
        const menuButton = document.createElement('button');
        menuButton.type = 'button';
        menuButton.className = 'menu-button';
        menuButton.setAttribute('aria-haspopup', 'true');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.innerHTML = '⋯';

        // Menu list (hidden by default)
        const menu = document.createElement('div');
        menu.className = 'menu-list';
        menu.setAttribute('role', 'menu');

        // Menu items
        const itemResize = document.createElement('button');
        itemResize.className = 'menu-item';
        itemResize.textContent = 'Resize';
        itemResize.type = 'button';
        itemResize.setAttribute('role', 'menuitem');

        const itemDownload = document.createElement('button');
        itemDownload.className = 'menu-item';
        itemDownload.textContent = 'Download';
        itemDownload.type = 'button';
        itemDownload.setAttribute('role', 'menuitem');

        const itemRemove = document.createElement('button');
        itemRemove.className = 'menu-item';
        itemRemove.textContent = 'Remove';
        itemRemove.type = 'button';
        itemRemove.setAttribute('role', 'menuitem');

        // wire up actions
        itemResize.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            closeAllMenus();
            try {
                await processSingle(idx);
            } catch (e) { /* errors handled in processSingle */ }
        });

        itemDownload.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeAllMenus();
            if (!it.outputBlob) {
                setStatus('No output for this image yet', true);
                return;
            }
            downloadBlob(it.outputBlob, it.outputName || it.name);
        });

        itemRemove.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeAllMenus();
            files.splice(idx, 1);
            renderThumbs();
            setStatus(`${files.length} image(s) ready`);
            updateZipButton();
        });

        // append items to menu
        menu.appendChild(itemResize);
        menu.appendChild(itemDownload);
        menu.appendChild(itemRemove);

        // toggle menu visibility
        function openMenu() {
            closeAllMenus(); 
            menu.classList.add('show');
            menuButton.setAttribute('aria-expanded', 'true');
            const rect = menu.getBoundingClientRect();
            if (rect.bottom > (window.innerHeight - 12)) {
                menu.classList.add('flip-up');
            } else {
                menu.classList.remove('flip-up');
            }
        }
        function closeMenu() {
            menu.classList.remove('show');
            menuButton.setAttribute('aria-expanded', 'false');
        }

        menuButton.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (menu.classList.contains('show')) closeMenu();
            else openMenu();
        });

        // keyboard accessibility for menu button
        menuButton.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                openMenu();
                const first = menu.querySelector('.menu-item');
                if (first) first.focus();
            } else if (ev.key === 'Escape') {
                closeMenu();
                menuButton.focus();
            }
        });

        // close menu when clicking inside thumb but outside menu (e.g., clicking image)
        div.addEventListener('click', (ev) => {
            if (ev.target.closest('.menu-list') || ev.target.closest('.menu-button')) return;
            closeMenu();
        });

        // assemble thumb
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.appendChild(menuButton);
        actions.appendChild(menu);

        div.append(img, fname, meta, actions);
        thumbs.appendChild(div);
    });

    updateZipButton();
}

function dataTypeFromFormat(format, origType) {
    if (format === 'orig') return origType || 'image/png';
    return format;
}

async function processSingle(index) {
    if (!files[index]) throw new Error('Invalid file index');
    const it = files[index];
    setStatus(`Resizing ${it.name}...`);
    const cfg = buildConfig();
    try {
        const result = await resizeImage(it.img, cfg, it.name, it.file.type);
        it.outputBlob = result.blob;
        it.outputName = result.name;
        renderThumbs();
        setStatus(`Resized ${it.name}`);
        updateZipButton();
    } catch (err) {
        console.error('processSingle error', err);
        setStatus('Resize error (see console)', true);
        throw err;
    }
}

function buildConfig() {
    const mode = modeEl.value;
    const format = formatEl.value;
    const quality = Number(qualityEl.value) / 100;
    const keepAspect = keepAspectEl.checked;
    const allowUpscale = (document.getElementById('allowUpscale') && document.getElementById('allowUpscale').checked) || false;
    const width = parseInt(widthEl.value) || 0;
    const height = parseInt(heightEl.value) || 0;
    const scalePct = Number(scalePctEl.value) || 100;
    return { mode, format, quality, keepAspect, width, height, scalePct };
}

async function processAll() {
    if (!files.length) { setStatus('No images to process', true); return; }
    setStatus('Processing images...');
    processBtn.disabled = true;
    for (let i = 0; i < files.length; i++) {
        await processSingle(i);
    }
    processBtn.disabled = false;
    setStatus(`Processed ${files.length} image(s)`);
}
processBtn.addEventListener('click', processAll);
clearBtn.addEventListener('click', () => { files = []; renderThumbs(); setStatus('Cleared'); });

modeEl.addEventListener('change', (e) => {
    const mode = e.target.value;
    if (scaleControls && sizeControls) {
        scaleControls.style.display = (mode === 'scale') ? 'block' : 'none';
        sizeControls.style.display = (mode === 'scale') ? 'none' : 'block';
    }
});

function calcTarget(origW, origH, cfg) {
    const clamp = (value, max) => cfg.allowUpscale ? value : Math.min(value, max);

    if (cfg.mode === 'scale') {
        const s = Math.max(0.01, cfg.scalePct / 100);
        return { w: Math.max(1, Math.round(origW * s)), h: Math.max(1, Math.round(origH * s)) };
    }
    if (cfg.mode === 'width') {
        let w = cfg.width || origW;
        if (!cfg.allowUpscale) w = Math.min(w, origW); // prevent enlarging unless allowed
        const h = cfg.keepAspect ? Math.round(origH * (w / origW)) : (cfg.height || origH);
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }
    if (cfg.mode === 'height') {
        let h = cfg.height || origH;
        if (!cfg.allowUpscale) h = Math.min(h, origH);
        const w = cfg.keepAspect ? Math.round(origW * (h / origH)) : (cfg.width || origW);
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }
    if (cfg.mode === 'fit') {
        const maxW = cfg.width || origW;
        const maxH = cfg.height || origH;
        let w = origW, h = origH;
        if (cfg.keepAspect) {
            const ratioBase = Math.min(maxW / origW, maxH / origH);
            const ratio = cfg.allowUpscale ? ratioBase : Math.min(ratioBase, 1); 
            w = Math.max(1, Math.round(origW * ratio));
            h = Math.max(1, Math.round(origH * ratio));
        } else {
            w = Math.min(origW, maxW); h = Math.min(origH, maxH);
        }
        return { w, h };
    }
    return { w: origW, h: origH };
}

function mimeToExt(mime) {
    if (!mime) return '.png';
    if (mime.includes('jpeg')) return '.jpg';
    if (mime.includes('png')) return '.png';
    if (mime.includes('webp')) return '.webp';
    return '.png';
}

function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
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

async function resizeImage(img, cfg, originalName, origType) {
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    const target = calcTarget(origW, origH, cfg);

    console.log(`Resizing "${originalName}" ${origW}×${origH} → ${target.w}×${target.h} (mode=${cfg.mode})`);
    setStatus(`Resizing ${originalName} → ${target.w}×${target.h}`);

    // safety cap
    const MAX_DIM = 12000;
    if (target.w > MAX_DIM || target.h > MAX_DIM) {
        throw new Error(`Target too large: ${target.w}×${target.h}. Try a smaller size.`);
    }

    // Create source canvas with the image's intrinsic pixels
    const src = document.createElement('canvas');
    src.width = origW;
    src.height = origH;
    const sctx = src.getContext('2d');
    sctx.drawImage(img, 0, 0, origW, origH);

    // Destination canvas sized to target
    const dest = document.createElement('canvas');
    dest.width = target.w;
    dest.height = target.h;

    // Preferred path: Pica (higher-quality)
    if (typeof pica !== 'undefined') {
        try {
            const p = pica({ features: ['js', 'wasm', 'cib'] }); // pica decides best available features
            const opts = { quality: 3, alpha: true, unsharpAmount: cfg.allowUpscale ? 0 : 80, unsharpRadius: 0.6, unsharpThreshold: 2 };
            await p.resize(src, dest, opts);
            const outMime = dataTypeFromFormat(cfg.format, origType);
            const blob = await p.toBlob(dest, outMime, cfg.quality || 0.92);
            const ext = mimeToExt(outMime);
            const nameNoExt = originalName.replace(/\.[^/.]+$/, "");
            const outName = `${nameNoExt}_${target.w}x${target.h}${ext}`;
            return { blob, name: outName };
        } catch (err) {
            console.warn('Pica path failed, falling back to canvas:', err);
        }
    }

    // Fallback path: use canvas drawImage + toBlob (works everywhere)
    const dctx = dest.getContext('2d');
    try {
        if (dctx) {
            dctx.imageSmoothingEnabled = true;
            try { dctx.imageSmoothingQuality = 'high'; } catch (e) { }
            dctx.drawImage(src, 0, 0, origW, origH, 0, 0, dest.width, dest.height);
        } else {
            const tempCtx = document.createElement('canvas').getContext('2d');
            tempCtx.canvas.width = dest.width; tempCtx.canvas.height = dest.height;
            tempCtx.drawImage(img, 0, 0, origW, origH, 0, 0, dest.width, dest.height);
        }

        const outMime = dataTypeFromFormat(cfg.format, origType);
        const blob = await new Promise(resolve => {
            try {
                if (outMime === 'image/png') dest.toBlob(resolve, outMime);
                else dest.toBlob(resolve, outMime, cfg.quality || 0.92);
            } catch (err) {
                try {
                    const dataURL = dest.toDataURL(outMime, cfg.quality || 0.92);
                    resolve(dataURLtoBlob(dataURL));
                } catch (e) { resolve(null); }
            }
        });

        const ext = mimeToExt(outMime);
        const nameNoExt = originalName.replace(/\.[^/.]+$/, "");
        const outName = `${nameNoExt}_${target.w}x${target.h}${ext}`;
        return { blob, name: outName };
    } catch (err) {
        console.error('Fallback resize error', err);
        throw err;
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'image';
    document.body.appendChild(a); a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function updateZipButton() {
    const any = files.some(f => f.outputBlob);
    if (zipAvailable && any) {
        downloadAllBtn.disabled = false;
    } else if (!zipAvailable && any) {
        downloadAllBtn.disabled = true;
        setStatus('JSZip missing — attempting to load from CDN...');
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            zipAvailable = typeof JSZip !== 'undefined';
            if (zipAvailable) {
                setStatus('JSZip loaded — ZIP enabled');
                downloadAllBtn.disabled = false;
            } else {
                setStatus('Failed to load JSZip (CDN blocked?)', true);
            }
        } catch (err) {
            console.error('loadScript error', err);
            setStatus('Could not load JSZip (see console)', true);
        }
    } else {
        downloadAllBtn.disabled = true;
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { console.log('Loaded script', src); resolve(); };
        s.onerror = (e) => { console.error('Script load error', e); reject(e); };
        document.head.appendChild(s);
    });
}

downloadAllBtn.addEventListener('click', async () => {
    if (!zipAvailable) { setStatus('ZIP requires JSZip. If you are offline, include jszip locally.', true); return; }
    const zip = new JSZip();
    const folder = zip.folder('resized-images');
    let count = 0;
    for (const f of files) {
        if (f.outputBlob) {
            const array = await f.outputBlob.arrayBuffer();
            folder.file(f.outputName || f.name, array);
            count++;
        }
    }
    if (count === 0) { setStatus('No processed images to zip', true); return; }
    setStatus('Creating ZIP...');
    try {
        const zblob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zblob, 'resized-images.zip');
        setStatus('ZIP ready');
    } catch (err) {
        console.error('ZIP generation error', err);
        setStatus('ZIP failed (see console)', true);
    }
});

/* keyboard accessibility */
thumbs.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.thumb')) {
        const nodes = Array.from(thumbs.querySelectorAll('.thumb'));
        const idx = nodes.indexOf(e.target.closest('.thumb'));
        if (idx >= 0) processSingle(idx);
    }
});

/* global error handler for debugging */
window.addEventListener('error', (ev) => {
    console.error('Window error:', ev.error || ev.message);
    setStatus('An error occurred (see console)', true);
});