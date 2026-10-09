// Panels own keyboard focus; Phaser alone owns movement state.
export function acceptsWorldInput(hasFocus: boolean, focused: Pick<Element, 'closest'> | null): boolean {
  return hasFocus && !focused?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"],[data-block-world-input]');
}

/** Keyboard intent belongs to the scene but must not wait for a rendered frame. */
export class MovementKeys {
  private held = new Set<string>();
  key(code: string, down: boolean, active: boolean): boolean {
    if (!['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) return false;
    if (!active) this.clear();
    else if (down) this.held.add(code);
    else this.held.delete(code);
    return true;
  }
  clear() { this.held.clear(); }
  intent(active: boolean): { x: number; y: number } {
    if (!active) this.clear();
    return { x: Number(this.held.has('KeyD')) - Number(this.held.has('KeyA')), y: Number(this.held.has('KeyS')) - Number(this.held.has('KeyW')) };
  }
}
