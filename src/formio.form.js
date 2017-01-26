"use strict";
let Formio = require('./formio');
let FormioComponents = require('./components/Components');
let EventEmitter = require('eventemitter2').EventEmitter2;
class FormioForm extends FormioComponents {
  constructor(element) {
    super(null, new EventEmitter({
      wildcard: false,
      maxListeners: 0
    }));

    this._src = '';
    this._loading = true;
    this.wrapper = element;
    this.formio = null;
    this.loader = null;
    this.onForm = null;
    this.onSubmission = null;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    if (!value || typeof value !== 'string') {
      return;
    }
    this._src = value;
    this.loading = true;
    this.formio = new Formio(value);
    this.onForm = this.formio.loadForm().then((form) => (this.form = form));
    if (this.formio.submissionId) {
      this.onSubmission = this.formio.loadSubmission().then((submission) => (this.submission = submission));
    }
  }

  on(event, cb) {
    return this.events.on(event, cb);
  }

  get ready() {
    return this.onSubmission ? this.onSubmission : this.onForm;
  }

  get loading() {
    return this._loading;
  }

  set loading(loading) {
    this._loading = loading;
    if (!this.loader && loading) {
      this.loader = document.createElement('div');
      this.loader.setAttribute('class', 'loader-wrapper');
      let spinner = document.createElement('div');
      spinner.setAttribute('class', 'loader text-center');
      this.loader.append(spinner);
    }
    if (this.loader) {
      if (loading) {
        this.wrapper.parentNode.insertBefore(this.loader, this.wrapper);
      }
      else {
        this.wrapper.parentNode.removeChild(this.loader);
      }
    }
  }

  set form(form) {
    // Set this form as a component.
    this.component = form;

    // Render the form.
    this.render();

    // Set the loading flag when we are ready.
    this.ready.then(() => (this.loading = false));
  }

  get value() {
    return {
      data: this.getValue()
    };
  }

  set value(submission) {
    this.setValue(submission.data);
  }

  render() {
    this.wrapper.innerHTML = '';
    this.build();
    this.wrapper.append(this.element);
    this.on('componentChange', (changed) => this.onComponentChange(changed));
  }

  build() {
    this.element = this.ce('form');
    this.element.setAttribute('method', 'POST');
    if (this.formio) {
      this.element.setAttribute('action', this.formio.formUrl + '/submission');
    }
    this.addComponents();
    this.checkConditions(this.getValue());
  }

  submit() {
    if (this.formio) {
      this.formio.saveSubmission(this.value)
        .then((submission) => this.events.emit('submit', submission))
        .catch((err) => this.events.emit('error', err));
    }
    else {
      this.events.emit('submit', this.value);
    }
  }

  onComponentChange(changed) {
    let value = this.value;
    value.changed = changed;
    this.events.emit('change', value);
    this.checkConditions(value.data);
  }
}
module.exports = FormioForm;