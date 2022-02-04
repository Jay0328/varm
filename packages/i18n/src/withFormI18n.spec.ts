import { config, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createI18n, useI18n } from 'vue-i18n';
import { ValidationError } from '@varm/core';
import { withFormI18n } from '.';

describe('withFormI18n', () => {
  const i18n = withFormI18n(
    createI18n({
      globalInjection: true,
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          foo: 'bar',
          bar: 'baz {qux}',
        },
      },
    })
  );
  config.global.plugins.push(i18n);

  describe('tf', () => {
    it('should set tf to i18n global', () => {
      expect(i18n.global.tf).not.toBeUndefined();
      expect(typeof i18n.global.tf).toBe('function');
    });

    describe('given result is string', () => {
      it('should consider result as message key', () => {
        const TestComponent = defineComponent({
          setup() {
            const { tf } = useI18n();

            return { tf };
          },
          template: `
            <div>{{tf('foo')}}</div>
          `,
        });
        const wrapper = mount(TestComponent);
        const div = wrapper.find('div');

        expect(div.text()).toBe('bar');
        expect(i18n.global.tf('foo')).toBe('bar');
      });
    });

    describe('given result is object', () => {
      it('should consider message of result as message key and payload of result as named', () => {
        const error: ValidationError = {
          message: 'bar',
          payload: { qux: 1 },
        };
        const TestComponent = defineComponent({
          setup() {
            const { tf } = useI18n();

            return { tf, result: error };
          },
          template: `
            <div>{{tf(result)}}</div>
          `,
        });
        const wrapper = mount(TestComponent);
        const div = wrapper.find('div');

        expect(i18n.global.tf(error)).toBe('baz 1');
        expect(div.text()).toBe('baz 1');
      });
    });
  });
});
