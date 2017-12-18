module CozySunBearEpubHelper
	def epub_viewer_setup
		javascripts = [ "cozy-sun-bear.js" ]
		if request.user_agent.match('Trident')
			javascripts << "javascripts/engines/epub.legacy.js"
		else
			javascripts << "javascripts/engines/epub.js"
		end
		stylesheet_link_tag('cozy-sun-bear', media: 'all') + javascript_include_tag(*javascripts)
	end
end
