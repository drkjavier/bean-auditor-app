import { fetchTags } from '../data/tagService';
import abortManager from '../infrastructure/api/abortManager';

describe('fetchTags cancellation', () => {
  it('rejects when provided signal is aborted', async () => {
    const ctrl: any = abortManager.createAndRegisterAbortController();

    const p = fetchTags(undefined, { signal: ctrl.signal });

    // abort immediately
    ctrl.abort();

    await expect(p).rejects.toBeTruthy();
  });
});
