import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {Extension as _Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const SCROLL_STEP = 10;

export default class Extension extends _Extension {
    constructor(metadata) {
        super(metadata)
        console.log(`Initiating ${this.uuid}`);
        this._enabled = false;

        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            const quickSettings = Main.panel.statusArea.quickSettings;
            if (!quickSettings._brightness)
                return GLib.SOURCE_CONTINUE;
            this._proxy = quickSettings._brightness.quickSettingsItems[0]._proxy;
            this._kbdProxy = quickSettings._backlight.quickSettingsItems[0]._proxy;
            this._system = quickSettings._system;
            this._reactive = [
                this._system._indicator.reactive,
                this._system._percentageLabel.reactive
            ];
            if (this._enabled)
                this.enable();
            console.log(`Initiated ${this.uuid}`);
            return GLib.SOURCE_REMOVE;
        });
    }

    _handleScrollEvent(actor, event) {
        let screen = false;
        let step, gicon, proxy;

        if (event.is_pointer_emulated())
            return Clutter.EVENT_PROPAGATE;

        switch (event.get_scroll_direction()) {
        case Clutter.ScrollDirection.DOWN:
            screen = true;
        case Clutter.ScrollDirection.LEFT:
            step  = SCROLL_STEP;
            break;
        case Clutter.ScrollDirection.UP:
            screen = true;
        case Clutter.ScrollDirection.RIGHT:
            step  = -SCROLL_STEP;
            break;
        case Clutter.ScrollDirection.SMOOTH:
            let [dx, dy] = event.get_scroll_delta();
            if (dx == 0 && dy == 0) {
                return Clutter.EVENT_STOP;
            } else if (Math.abs(dx) < Math.abs(dy)) {
                screen = true;
                step  = dy * SCROLL_STEP;
            } else {
                step  = -dx * SCROLL_STEP;
            }
        }

        if (screen) {
            gicon = new Gio.ThemedIcon({name: 'display-brightness-symbolic'});
            proxy = this._proxy;
        } else {
            gicon = new Gio.ThemedIcon({name: 'keyboard-brightness-symbolic'});
            proxy = this._kbdProxy;
        }

        let brightness = proxy.Brightness;
        let label = null;
        if (brightness !== null) {
            brightness = Math.min(100, Math.max(0, brightness + step));
            proxy.Brightness = brightness;
        } else {
            brightness = 0;
            label = 'Not available.';
        }

        Main.osdWindowManager.show(-1, gicon, label, brightness/100, 1);
        return Clutter.EVENT_STOP;
    }

    enable() {
        this._enabled = true;
        if (!this._system)
            return;
        const system = this._system;
        system._indicator.reactive = true;
        system._percentageLabel.reactive = true;
        this._scrollIds = [
            system._indicator.connect('scroll-event',
                this._handleScrollEvent.bind(this)),
            system._percentageLabel.connect('scroll-event',
                this._handleScrollEvent.bind(this))
        ];
        console.log(`Enabled ${this.uuid}`);
    }

    disable() {
        this._enabled = false;
        if (!this._system)
            return;
        const system = this._system;
        [ system._indicator.reactive,
          system._percentageLabel.reactive ] = this._reactive;
        system._indicator.disconnect(this._scrollIds[0]);
        system._percentageLabel.disconnect(this._scrollIds[0]);
        console.log(`Disabled ${this.uuid}`);
    }
}
