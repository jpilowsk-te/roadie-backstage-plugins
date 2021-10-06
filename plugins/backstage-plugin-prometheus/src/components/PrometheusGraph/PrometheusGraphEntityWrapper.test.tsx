/*
 * Copyright 2021 Larder Software Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { msw } from '@backstage/test-utils';
import { ApiProvider, ApiRegistry } from '@backstage/core-app-api';
import { configApiRef, errorApiRef } from '@backstage/core-plugin-api';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { PrometheusGraphEntityWrapper } from './PrometheusGraphEntityWrapper';
import { prometheusApiRef } from '../../api';

const entityMock = {
  metadata: {
    namespace: 'default',
    annotations: {
      'prometheus.io/rule': 'memUsage',
    },
    name: 'sample-service',
    description:
      'A service for testing Backstage functionality. For example, we can trigger errors\non the sample-service, these are sent to Sentry, then we can view them in the \nBackstage plugin for Sentry.\n',
    uid: '33f123a4-e83e-4d3f-8baa-631266c5638b',
    etag: 'ZTVmZThhZDctN2VkYi00OTI5LTlkZDMtZTBkNDA4ODg3NDQ4',
    generation: 1,
  },
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
};

const mockErrorApi = {
  post: jest.fn(),
};

const config = {
  getOptionalConfigArray: (_: string) => [
    { getOptionalString: (_s: string) => 'test.server/url' },
  ],
};

const mockPrometheusApi = {
  query: () => require('../../mocks/mockQueryResponse.json'),
};

const apis = ApiRegistry.from([
  [configApiRef, config],
  [prometheusApiRef, mockPrometheusApi],
  [errorApiRef, mockErrorApi],
]);

describe('PrometheusGraphEntityWrapper', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  msw.setupDefaultHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('test.server/url/*', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json(require('../../mocks/mockQueryResponse.json')),
        ),
      ),
    );
  });
  it('should render container for queries', async () => {
    const rendered = render(
      <ApiProvider apis={apis}>
        <EntityProvider entity={entityMock}>
          <PrometheusGraphEntityWrapper />
        </EntityProvider>
      </ApiProvider>,
    );
    expect(await rendered.findByText('memUsage')).toBeInTheDocument();
  });
});
