require 'swagger_helper'

RSpec.describe 'api/v2/comments', type: :request do

  path '/api/v2/comments' do

    get('list comments') do
      response(200, 'successful') do
        run_test!
      end
    end

    post('create comment') do
      response(400, 'bad request - missing required params') do
        run_test!
      end
    end
  end

  path '/api/v2/comments/{id}' do
    parameter name: 'id', in: :path, type: :string, description: 'comment id'

    get('show comment') do
      response(404, 'not found') do
        let(:id) { '999999' }
        run_test!
      end
    end

    patch('update comment') do
      response(401, 'unauthorized') do
        let(:id) { '1' }
        run_test!
      end
    end

    delete('delete comment') do
      response(401, 'unauthorized') do
        let(:id) { '1' }
        run_test!
      end
    end
  end

  path '/api/v2/comments/{id}/approve' do
    parameter name: 'id', in: :path, type: :string, description: 'comment id'

    patch('approve comment') do
      response(401, 'unauthorized - admin/editor required') do
        let(:id) { '1' }
        run_test!
      end
    end
  end

  path '/api/v2/comments/{id}/unapprove' do
    parameter name: 'id', in: :path, type: :string, description: 'comment id'

    patch('unapprove comment') do
      response(401, 'unauthorized - admin/editor required') do
        let(:id) { '1' }
        run_test!
      end
    end
  end

  path '/api/v2/comments/{id}/spam' do
    parameter name: 'id', in: :path, type: :string, description: 'comment id'

    patch('mark comment as spam') do
      response(401, 'unauthorized - admin/editor required') do
        let(:id) { '1' }
        run_test!
      end
    end
  end

  path '/api/v2/comments/{id}/trash' do
    parameter name: 'id', in: :path, type: :string, description: 'comment id'

    patch('trash comment') do
      response(401, 'unauthorized - admin/editor required') do
        let(:id) { '1' }
        run_test!
      end
    end
  end
end
