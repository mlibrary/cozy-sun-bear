module Cozy
  module Sun
    module Bear
      class Engine < Rails::Engine
        config.assets.paths << File.expand_path("../../../../../dist", __FILE__)
        config.assets.paths << File.expand_path("../../../../../vendor/javascripts", __FILE__)
        config.assets.precompile << File.expand_path("../../../../../dist/fonts/open-iconic.*", __FILE__)
      end
    end
  end
end
