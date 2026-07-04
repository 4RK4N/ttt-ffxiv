import { describe, expect, it } from 'vitest';
import { formBodyToValues, parseBracketForm } from '../src/web/ui/editor/form-parse.js';
import type { WebPlugin } from '../src/web/plugin-types.js';

describe('parseBracketForm', () => {
  it('parses flat scalar keys', () => {
    expect(parseBracketForm({ welcomeContent: 'hi' })).toEqual({ welcomeContent: 'hi' });
  });

  it('parses nested object-list keys', () => {
    const tree = parseBracketForm({
      'panels[0].id': 'a',
      'panels[0].channelId': '123',
      'panels[0].panelTitle': 'Title',
    });
    expect(tree.panels).toEqual([{ id: 'a', channelId: '123', panelTitle: 'Title' }]);
  });

  it('parses multi-select array keys', () => {
    const tree = parseBracketForm({ 'allowedChannels[]': ['111', '222'] });
    expect(tree.allowedChannels).toEqual(['111', '222']);
  });
});

describe('formBodyToValues', () => {
  const scalarPlugin: WebPlugin = {
    namespace: 'test',
    title: 'Test',
    fields: [
      { key: 'name', label: 'Name', type: 'text', store: 'texts' },
      { key: 'enabled', label: 'On', type: 'boolean', store: 'config' },
      { key: 'channels', label: 'Ch', type: 'channel-multi', store: 'config' },
    ],
  };

  it('maps scalar text and boolean', () => {
    const values = formBodyToValues(scalarPlugin, {
      name: 'hello',
      enabled: 'true',
    });
    expect(values.name).toBe('hello');
    expect(values.enabled).toBe(true);
  });

  it('treats missing boolean as false', () => {
    const values = formBodyToValues(scalarPlugin, { name: 'x' });
    expect(values.enabled).toBe(false);
  });

  it('maps channel-multi from bracket arrays', () => {
    const values = formBodyToValues(scalarPlugin, {
      'channels[]': ['111', '222'],
    });
    expect(values.channels).toEqual(['111', '222']);
  });
});
