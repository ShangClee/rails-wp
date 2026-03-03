require 'swagger_helper'

RSpec.describe 'api/v2/posts', type: :request do

  path '/api/v2/posts' do

    get('list posts') do
      response(200, 'successful') do
        run_test!
      end
    end

    post('create post') do
      response(401, 'unauthorized') do
        run_test!
      end
    end
  end

  path '/api/v2/posts/{id}' do
    # You'll want to customize the parameter types...
    parameter name: 'id', in: :path, type: :string, description: 'id'

    get('show post') do
      response(404, 'not found') do
        let(:id) { '123' }
        run_test!
      end
    end

    patch('update post') do
      response(401, 'unauthorized') do
        let(:id) { '123' }
        run_test!
      end
    end

    put('update post') do
      response(401, 'unauthorized') do
        let(:id) { '123' }
        run_test!
      end
    end

    delete('delete post') do
      response(401, 'unauthorized') do
        let(:id) { '123' }
        run_test!
      end
    end
  end
end
