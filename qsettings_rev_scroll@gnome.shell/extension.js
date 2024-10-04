import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import {Extension as _Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class Extension extends _Extension {
    constructor(metadata) {
        super(metadata)
        console.log(`Initiating ${this.uuid}`);
        this._enabled = false;

        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            const quickSettings = Main.panel.statusArea.quickSettings;
            if (!quickSettings._volumeOutput)
                return GLib.SOURCE_CONTINUE;

            this._volumeInputSlider = quickSettings._volumeInput._input.slider;
            this._volumeInputSlider._scroll = this._volumeInputSlider.scroll;

            this._volumeOutputSlider = quickSettings._volumeOutput._output.slider;
            this._volumeOutputSlider._scroll = this._volumeOutputSlider.scroll;

            this._brightnessSlider = quickSettings._brightness.quickSettingsItems[0].slider;
            this._brightnessSlider._scroll = this._brightnessSlider.scroll;

            this._backlightSlider = quickSettings._backlight.quickSettingsItems[0]._sliderItem._slider;
            this._backlightSlider._scroll = this._backlightSlider.scroll;

            if (this._enabled)
                this.enable();

            console.log(`Initiated ${this.uuid}`);
            return GLib.SOURCE_REMOVE;
        });
    }

    reverseSlider(slider) {
        slider.scroll = (event) => {
            let direction = event.get_scroll_direction();
            if (direction === Clutter.ScrollDirection.DOWN)
                direction = Clutter.ScrollDirection.UP;
            else if (direction === Clutter.ScrollDirection.UP)
                direction = Clutter.ScrollDirection.DOWN;
            event.get_scroll_direction = () => { return direction; };

            let [dx, dy] = event.get_scroll_delta();
            event.get_scroll_delta = () => { return [dx, -dy]; };

            return slider._scroll(event);
        };
    }

    enable() {
        this._enabled = true;
        if (!this._volumeOutputSlider)
            return;
        
        this.reverseSlider(this._volumeInputSlider);
        this.reverseSlider(this._volumeOutputSlider);
        this.reverseSlider(this._brightnessSlider);
        this.reverseSlider(this._backlightSlider);

        console.log(`Enabled ${this.uuid}`);
    }

    disable() {
        this._enabled = false;
        if (!this._volumeOutputSlider)
            return;

        this._volumeInputSlider.scroll = this._volumeInputSlider._scroll;
        this._volumeOutputSlider.scroll = this._volumeOutputSlider._scroll;
        this._brightnessSlider.scroll = this._brightnessSlider._scroll;
        this._backlightSlider.scroll = this._backlightSlider._scroll;

        console.log(`Disabled ${this.uuid}`);
    }
}
