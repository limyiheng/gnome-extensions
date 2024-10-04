import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension as _Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const UPDATE_INTERVAL = 1000;

export default class Extension extends _Extension {
    _update() {
        const file = Gio.File.new_for_path('/proc/meminfo');
        const [success_, contents] = file.load_contents(null);
        const values = new TextDecoder().decode(contents)
            .split('\n')
            .filter(line => line.startsWith('MemAvailable') ||
                            line.startsWith('SwapFree'))
            .map(line => {
                const value = parseInt(line.match(/\d+/)[0]);
                return (value/1024/1024).toFixed(2);
            });
        this._label.set_text(`${values[0]} M/S ${values[1]}`)
    }

    enable() {
        this._indicator = new PanelMenu.Button(0.0, 'Memory Info', false);
        this._label = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER
        });
        this._indicator.add_child(this._label);

        Main.panel.addToStatusArea('Memory Info', this._indicator);

        this._updateId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            UPDATE_INTERVAL,
            () => {
                this._update();
                return GLib.SOURCE_CONTINUE;
            });
        GLib.Source.set_name_by_id(this._updateId, '[Mem-info] Update');
        console.log(`Enabled ${this.uuid}`);
    }

    disable() {
        if (this._updateId != 0) {
            GLib.source_remove(this._updateId);
            this._updateId = 0;
        }
        this._indicator.destroy();
        this._indicator = null;
        this._lebel = null;
        console.log(`Disabled ${this.uuid}`);
    }
}
