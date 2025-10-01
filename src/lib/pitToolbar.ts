
interface IPinToolbarOptions {
	toolbarSelector?: string;
	textboxSelector?: string;
	containerSelector: string;
	anchorSelector?: string;
	fullWidth?: boolean;
	zIndex?: number;
	offsetTop?: number;
	enterDeltaPx?: number;
	exitDeltaPx?: number;
	debug?: boolean;
}

export function pinToolbar(opts: IPinToolbarOptions) {
	const {
		toolbarSelector = '[role="toolbar"]',
		textboxSelector = '[role="textbox"]',
		containerSelector,
		anchorSelector,
		fullWidth = false,
		zIndex = 99,
		offsetTop = 0,
		enterDeltaPx = 0,
		exitDeltaPx = 6,
		debug = false,
	} = opts;

	if (!toolbarSelector || !containerSelector) {
		console.warn('pinToolbar: toolbar or container selectors not provided');
		return () => {};
	}

	const toolbar = document.querySelector<HTMLElement>(toolbarSelector);
	const textbox = document.querySelector<HTMLElement>(textboxSelector);
	const container = document.querySelector<HTMLElement>(containerSelector);

	if (!toolbar || !container) {
		console.warn('pinToolbar: toolbar or container not found');
		return () => {};
	}

	const anchor = (anchorSelector && document.querySelector<HTMLElement>(anchorSelector)) || container;

	const sentinel = document.createElement('div');
	sentinel.setAttribute('data-toolbar-sentinel', 'true');
	toolbar.parentElement?.insertBefore(sentinel, toolbar);

	const spacer = document.createElement('div');
	spacer.setAttribute('data-toolbar-spacer', 'true');

	const prev = {
		position: toolbar.style.position,
		top: toolbar.style.top,
		left: toolbar.style.left,
		right: toolbar.style.right,
		width: toolbar.style.width,
		zIndex: toolbar.style.zIndex,
		margin: toolbar.style.margin,
	};

	let fixed = false;

	const applyFixedStyles = () => {
		const aRect = anchor.getBoundingClientRect();
		const tbRect = toolbar.getBoundingClientRect();

		const h = tbRect.height;
		spacer.style.height = `${h}px`;

		toolbar.style.position = 'fixed';
		toolbar.style.zIndex = String(zIndex);
		toolbar.style.margin = '0';

		if (fullWidth) {
			toolbar.style.top = `${offsetTop}px`;
			toolbar.style.left = '0';
			toolbar.style.right = '0';
			toolbar.style.width = '100%';
		} else {
			toolbar.style.top = `${Math.max(aRect.top + offsetTop, 0)}px`;
			toolbar.style.left = `${Math.max(tbRect.left, 0)}px`;
			toolbar.style.right = 'auto';
			toolbar.style.width = `${tbRect.width}px`;
		}
	};

	const fix = () => {
		if (fixed) return;
		fixed = true;
		toolbar.parentElement?.insertBefore(spacer, toolbar.nextSibling);
		applyFixedStyles();
		if (debug) console.log('[pinToolbar] -> fixed');
	};

	const unfix = () => {
		if (!fixed) return;
		fixed = false;
		spacer.remove();
		toolbar.style.position = prev.position;
		toolbar.style.top = prev.top;
		toolbar.style.left = prev.left;
		toolbar.style.right = prev.right;
		toolbar.style.width = prev.width;
		toolbar.style.zIndex = prev.zIndex;
		toolbar.style.margin = prev.margin;
		if (debug) console.log('[pinToolbar] -> default');
	};

	const wantFixed = (): boolean => {
		const cont = container.getBoundingClientRect();
		const sent = sentinel.getBoundingClientRect();

		const line = cont.top + offsetTop;
		if (!fixed) {
			return sent.top <= line - enterDeltaPx && cont.bottom > 0;
		} else {
			return !(sent.top >= line + exitDeltaPx || cont.bottom <= 0);
		}
	};

	let raf = 0;
	const tick = () => {
		raf = 0;
		const should = wantFixed();
		if (should && !fixed) fix();
		else if (!should && fixed) unfix();
		if (fixed) applyFixedStyles();
	};

	const onScrollOrResize = () => {
		if (raf) return;
		raf = requestAnimationFrame(tick);
	};

	window.addEventListener('scroll', onScrollOrResize, { passive: true });
	window.addEventListener('resize', onScrollOrResize);
	window.addEventListener('wheel', onScrollOrResize, { passive: true });
	window.addEventListener('touchmove', onScrollOrResize, { passive: true });
	window.addEventListener('orientationchange', onScrollOrResize);

	const roA = new ResizeObserver(() => fixed && applyFixedStyles());
	roA.observe(anchor);

	const roRes = new ResizeObserver(() => onScrollOrResize());
	if(textbox) roRes.observe(textbox);

	onScrollOrResize();

	return () => {
		cancelAnimationFrame(raf);
		window.removeEventListener('scroll', onScrollOrResize);
		window.removeEventListener('resize', onScrollOrResize);
		window.removeEventListener('wheel', onScrollOrResize);
		window.removeEventListener('touchmove', onScrollOrResize);
		window.removeEventListener('orientationchange', onScrollOrResize);
		roA.disconnect();
		roRes.disconnect();
		unfix();
		sentinel.remove();
	};
}
