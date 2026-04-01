Rails.application.routes.draw do
  mount Rswag::Api::Engine => '/api-docs'
  post "/graphql", to: "graphql#execute"
  devise_for :wp_users, path: 'api/v2', path_names: {
    sign_in: 'login',
    sign_out: 'logout',
    registration: 'register'
  },
  controllers: {
    sessions: 'api/v2/sessions',
    registrations: 'api/v2/registrations'
  },
  defaults: { format: :json }

  namespace :api do
    namespace :v2 do
      resources :posts do
        resources :revisions, only: [:index], controller: 'revisions'
        resources :meta, only: [:index, :create, :update, :destroy], controller: 'post_meta'
      end
      post 'revisions/:id/restore', to: 'revisions#restore'
      resources :pages
      resources :media
      resources :taxonomies do
        collection do
          get :post_formats
        end
      end
      resources :categories
      resources :tags
      resources :comments do
        member do
          patch :approve
          patch :unapprove
          patch :spam
          patch :trash
        end
      end
      resources :menus do
        resources :items, controller: 'menu_items', only: [:create, :update, :destroy]
      end
      resource :settings, only: [:show, :update]
      resources :setup, only: [:index, :create]
      resources :users, only: [:index, :show, :update] do
        member do
          patch :role
        end
        collection do
          get 'me'
        end
      end
      get 'health', to: 'health#show'
      get 'types', to: 'post_types#index'
    end
  end

  namespace :rails do
    get "health", to: "health#show"
  end
  get "up" => "rails/health#show", as: :rails_health_check

  # Public frontend routes
  resources :posts, only: [:index, :show]
  get '/:slug', to: 'pages#show', as: :page

  root to: "posts#index"
end
