require 'swagger_helper'

RSpec.describe 'api/v2/types', type: :request do

  path '/api/v2/types' do

    get('list post types') do
      response(200, 'returns built-in WordPress post types') do
        run_test!
      end
    end
  end
end
