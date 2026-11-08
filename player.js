// Central playback manager: ONE Audio element + ONE state object shared by every UI component.
const au = new Audio();
au.preload = 'metadata';
const subs = [];
const emit = (k) => subs.forEach((f) => f(k));
const shuffle = (a) => { a = [...a]; for (let i = a.length; i > 1;) { const j = Math.random() * i-- | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let vol = parseFloat(localStorage.getItem('soundscape.vol'));
if (!(vol >= 0 && vol <= 1)) vol = 0.8;
au.volume = vol;
let prevVol = vol || 0.8;

export const player = {
  audio: au, q: [], orig: [], i: -1, shuf: false, rep: 0 /* 0 off, 1 all, 2 one */, loading: false, dragging: false,
  get cur() { return this.q[this.i]; },
  get muted() { return au.muted || au.volume === 0; },
  get volume() { return au.muted ? 0 : au.volume; },
  on(f) { subs.push(f); },
  load(i, play = true) {
    const t = this.q[i]; if (!t) return;
    this.i = i; this.loading = true; au.src = t.preview;
    emit('track'); emit('state');
    if (play) au.play().catch(() => { this.loading = false; emit('state'); });
  },
  setQueue(ts, id) {
    ts = (ts || []).filter((t) => t && t.preview); if (!ts.length) return;
    const t = ts.find((x) => x.id == id) || ts[0];
    this.orig = [...ts];
    this.q = this.shuf ? [t, ...shuffle(ts.filter((x) => x.id != t.id))] : [...ts];
    this.load(this.q.indexOf(t));
  },
  playPause() { if (!this.cur) return; au.paused ? au.play().catch(() => {}) : au.pause(); },
  next() {
    if (!this.q.length) return;
    if (this.i < this.q.length - 1) return this.load(this.i + 1);
    if (this.rep === 1) { // repeat all: wrap around (reshuffle when shuffle is on)
      if (this.shuf && this.q.length > 1) { const c = this.cur; do { this.q = shuffle(this.q); } while (this.q[0].id == c.id); }
      return this.load(0);
    }
    au.pause(); au.currentTime = 0; emit('state'); // end of queue, repeat off
  },
  prev() { if (au.currentTime > 3 || this.i <= 0) au.currentTime = 0; else this.load(this.i - 1); },
  toggleShuffle() {
    this.shuf = !this.shuf;
    if (this.q.length) {
      const c = this.cur;
      if (this.shuf) this.q = [...this.q.slice(0, this.i + 1), ...shuffle(this.q.slice(this.i + 1))];
      else { const have = new Set(this.q.map((t) => t.id)); this.q = [...this.orig.filter((t) => have.has(t.id)), ...this.q.filter((t) => !this.orig.some((o) => o.id == t.id))]; this.i = this.q.findIndex((t) => t.id == c.id); }
    }
    emit('state');
  },
  cycleRepeat() { this.rep = (this.rep + 1) % 3; emit('state'); },
  setVolume(v) { au.muted = false; au.volume = v; vol = v; if (v > 0) prevVol = v; localStorage.setItem('soundscape.vol', String(v)); emit('state'); },
  toggleMute() {
    if (this.muted) { au.muted = false; au.volume = prevVol || 0.5; vol = au.volume; localStorage.setItem('soundscape.vol', String(vol)); }
    else { prevVol = au.volume; au.muted = true; }
    emit('state');
  },
  seek(s) { if (au.duration) au.currentTime = clampT(s, au.duration); },
  add(t, next) { // next=true -> play next, otherwise end of queue; never duplicates a track
    if (!this.q.length) return this.setQueue([t], t.id);
    const c = this.cur; if (t.id == c.id) return false;
    this.q = this.q.filter((x) => x.id != t.id); this.i = this.q.findIndex((x) => x.id == c.id);
    this.q.splice(next ? this.i + 1 : this.q.length, 0, t);
    if (!this.orig.some((x) => x.id == t.id)) this.orig.push(t);
    emit('state'); return true;
  },
  remove(k) { if (k > this.i) { this.q.splice(k, 1); emit('state'); } },
  move(k, d) { const j = k + d; if (k > this.i && j > this.i && j < this.q.length) { [this.q[k], this.q[j]] = [this.q[j], this.q[k]]; emit('state'); } },
  clear() { this.q = this.q.slice(0, this.i + 1); this.orig = [...this.q]; emit('state'); },
  playAt(k) { this.load(k); },
};
const clampT = (s, d) => Math.min(Math.max(0, s), d);

// Audio events are attached exactly once here (no duplicate listeners).
au.addEventListener('play', () => emit('state'));
au.addEventListener('pause', () => emit('state'));
au.addEventListener('playing', () => { player.loading = false; emit('state'); });
au.addEventListener('waiting', () => { player.loading = true; emit('state'); });
au.addEventListener('timeupdate', () => emit('time'));
au.addEventListener('loadedmetadata', () => emit('time'));
au.addEventListener('error', () => { player.loading = false; emit('state'); emit('error'); });
au.addEventListener('ended', () => { if (player.rep === 2) { au.currentTime = 0; au.play(); } else player.next(); });

if ('mediaSession' in navigator) {
  const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch {} };
  h('play', () => au.play()); h('pause', () => au.pause()); h('previoustrack', () => player.prev()); h('nexttrack', () => player.next());
  player.on((k) => { if (k === 'track' && player.cur) { const t = player.cur; navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album || '', artwork: t.artwork ? [{ src: t.artwork, sizes: '600x600' }] : [] }); } });
}
