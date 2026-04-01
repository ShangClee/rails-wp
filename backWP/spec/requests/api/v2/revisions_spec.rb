require 'swagger_helper'

RSpec.describe 'api/v2/posts/:post_id/revisions', type: :request do

  path '/api/v2/posts/{post_id}/revisions' do
    parameter name: 'post_id', in: :path, type: :string, description: 'post_id'

    get('list revisions') do
      response(401, 'unauthorized - requires authentication') do
        let(:post_id) { '1' }
        run_test!
      end
    end
  end

  path '/api/v2/revisions/{id}/restore' do
    parameter name: 'id', in: :path, type: :string, description: 'revision id'

    post('restore revision') do
      response(401, 'unauthorized - requires authentication') do
        let(:id) { '1' }
        run_test!
      end
    end
  end
end
