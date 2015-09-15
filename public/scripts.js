var socket = io();
//var inputs = require('src/inputs');
socket.emit('connected', 'Connected!');

var inputs = {};

inputs.binds = function (prop) {
  return {
    oninput: m.withAttr("value", prop),
    value: prop()
  };
};

inputs.createInput = function (field) {
  if (field.type === 'select') {
    return inputs.createInputDropdown(field);
  } else if (field.type === 'multiselect') {
    return inputs.createInputDropdown(field, true);
  }
  return inputs.createInputText(field);
};

inputs.createInputDropdown = function (field, isMultiple) {
  field.options = field.options || [];
  var props = {};
  props.size = field.options.length;
  if (isMultiple) {
    props.multiple = 'multiple';
  }
  var s = m('select', props,
    field.options.map(function (option) {
      var opts = {
        value: option.value
      };
      if (option.selected) {
        opts.selected = 'selected';
      }
      return m('option', opts, option.label);
    })
  );
  console.log(s);
  return s;
};

inputs.createInputText = function (field) {
  return m('input#' + field.id + '.row[type=text]', inputs.binds(field.value));
};


var module = {};
module.controller = function () {
  var vm = this;
  var submit = function (shortcut) {
    return function (e) {
      socket.emit('shortcut', shortcut);
      shortcut.modal.visible(false);
      e.preventDefault();
    };
  };
  vm.shortcuts = m.prop([]);
  m.request({
    method: "GET",
    url: "/shortcuts.json"
  }).then(vm.shortcuts).then(function (shortcuts) {
    shortcuts.map(function (shortcut) {
      shortcut.modal = {};
      shortcut.form = shortcut.form || [];
      var id = 0;
      shortcut.form.map(function (field) {
        field.value = m.prop(field.default || '');
        field.id = id++;
      });
      shortcut.modal.visible = m.prop(false);
      shortcut.modal.view = function () {
        if (!shortcut.modal.visible()) {
          return '';
        }
        return m('#modal.modal-wrapper', [
          m('.modal-container', [
            m('form.modal-form', {
              onsubmit: submit(shortcut)
            }, [
              m('h2', shortcut.name),
              shortcut.form.map(function (field) {
                return m('.group', [
                  m('label[for=' + field.id + ']', field.label),
                  m('br'),
                  inputs.createInput(field),
                  m('hr')
                ]);
              }),
              m('.input-group', [
                m('p', [
                  m('input[type=submit]', {
                    onclick: submit(shortcut),
                    value: 'Create'
                  })
                ])
              ])
            ]),
            m('button.modal-close', {
              onclick: shortcut.modal.visible.bind(this, false)
            }, 'X')
          ])
        ]);
      };
    });
  });
};
module.view = function (vm) {
  return [
    m('.shortcut-container', [
      vm.shortcuts().map(function (shortcut) {
        return m('button.monobutton', {
          onclick: shortcut.modal.visible.bind(this, true)
        }, shortcut.name);
      })
    ]),
    vm.shortcuts().map(function (shortcut) {
      return shortcut.modal.view();
    })
  ];
};
m.module(document.getElementById('nav'), module)
