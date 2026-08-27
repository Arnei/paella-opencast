import { EventLogPlugin, Events, createElementWithHtmlText } from '@asicupv/paella-core';
import '../css/TextboxPlugin.css';
import OpencastPaellaPluginsModule from './OpencastPaellaPluginsModule';

interface Textbox {
    start: number;
    text: string;
    link?: string;
}

export default class TextBoxPlugin extends EventLogPlugin {
  getPluginModuleInstance() {
    return OpencastPaellaPluginsModule.Get();
  }

  get name() {
    return super.name || "org.opencast.paella.textboxPlugin";
  }

  _textboxes: Map<any, any> = new Map();
  _textboxJSON: Textbox[] = [];
  _container: HTMLDivElement | null = null;


  // Initialize
  async load() {
    this._textboxes = new Map(); // DOM elements
    this._textboxJSON = []; // Infos from the Opencast mediapackage

    // Create textbox container
    this._container = document.createElement('div');
    this._container.className = 'textbox-plugin-container';
    // Append to player-container to not dissappear during fullscreen
    document.querySelector('.player-container')?.appendChild(this._container);

    /* Demo json for quick developing purposes */
    // const myTestJson = [
    //   {
    //     start: 2000,
    //     text: 'Samalamadingdong',
    //   },
    //   {
    //     start: 3000,
    //     text: 'Get in the comments',
    //     link: 'https://opencast.org',
    //   }
    // ];
    // this._textboxJSON = myTestJson;
  }

  // Define which events we subscribe too
  get events() {
    return [
      Events.PLAYER_LOADED,
      Events.TIMEUPDATE
    ];
  }


  async onEvent(event: Events, params: any) {
    // Load textbox info from Opencast
    if (event === Events.PLAYER_LOADED) {
      // TODO: Handle multiple textbox files
      const box = this.player?.videoManifest?.textboxes?.[0];
      if (box) {
        //@ts-ignore: type confuciosn
        this._textboxJSON = await this.loadTextboxesFromOpencast(box.url);
      }
    }

    // Display/Hide textboxes
    this._textboxJSON.forEach((boxInfo, index) => {
      const start = (boxInfo.start / 1000);
      const end = (boxInfo.start / 1000) + 10;
      if (params.currentTime > start && params.currentTime < end && !this._textboxes.get(index)) {
        this.createBox(boxInfo, index);
      }
      if ((params.currentTime < start || params.currentTime > end) && this._textboxes.get(index)) {
        this.removeBox(index);
      }
    });

  }

  // Add a textbox to the DOM
  createBox(info: Textbox, index: number) {
    if (!this._textboxes.get(index)) {
      let textbox = undefined;

      textbox = createElementWithHtmlText(`
        <details class="textbox-plugin-details"> </details>
      `, this._container!);

      let summary = createElementWithHtmlText(`
        <summary class="textbox-plugin-summary"> </summary>
      `, textbox);

      createElementWithHtmlText(`
        <div class="textbox-plugin-content">
          ${ info.text }
          </br>
          <a href=${ info.link } target="_blank" rel="noopener noreferrer">${ info.link }</a>
        </div>
      `, textbox);

      createElementWithHtmlText(`
        <div class="textbox-plugin-icon">i</div>
      `, summary);

      createElementWithHtmlText(`
        <span class="textbox-plugin-title">${ info.text }</span>
      `, summary);

      createElementWithHtmlText(`
        <span class="textbox-plugin-toggle" aria-hidden="true"></span>
      `, summary);

      this._textboxes.set(index, textbox);
    }
  }

  // Remove a textbox from the DOM
  removeBox(index: number) {
    if (this._textboxes.get(index)) {
      this._container!.removeChild(this._textboxes.get(index));
      this._textboxes.set(index, null);
    }
  }

  // Query Opencast for a json with info about textboxes
  loadTextboxesFromOpencast = async (url: string) => {
    let boxes: Textbox[] = [];
    const response = await fetch(url);
    if (response.ok) {
      try {
        boxes = await response.json();
      }
      catch (e) {
        this.player.log.warn('Error loading boxes');
      }
    }
    return boxes;
  };
}
