from django.conf.urls import patterns, include, url
from django.contrib import admin
from bandmanagerdjango import views

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'BandManagerDjango.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', views.index, name='index'),
    url(r'^#[.]*$', views.index, name='index'),
    url(r'^app/(?P<band_id>\w+)$', views.app, name='app'),
    url(r'^joinBand/(?P<band_id>\w+)$', views.join_band, name='joinBand'),
    url(r'^login$', views.login, name='login'),
    url(r'^logout$', views.logout, name='logout'),
    url(r'^loginFailure$', views.login_failure, name='loginFailure'),
    url(r'^register$', views.register, name='register'),
    url(r'^registerFailure$', views.register_failure, name='registerFailure'),
    url(r'^checkIfUsernameExists$', views.check_if_username_exists, name='checkIfUsernameExists'),
    url(r'^newBand$', views.new_band, name='newBand'),
    url(r'^admin/', include(admin.site.urls)),

    #json serializers for communication with angular app
    url(r'^json/band/(?P<band_id>\w+)$', views.json_band, name='jsonBand'),
    url(r'^json/checkIfManager/(?P<band_id>\w+)$', views.json_check_if_manager, name='jsonCheckIfManager'),
    url(r'^json/merch/(?P<band_id>\w+)$', views.json_merch, name='jsonMerch'),
    url(r'^json/merch_options/(?P<band_id>\w+)$', views.json_merch_options, name='jsonMerchOptions'),
    url(r'^json/shows/(?P<band_id>\w+)$', views.json_shows, name='jsonShows'),
    url(r'^json/schedules/(?P<band_id>\w+)$', views.json_schedules, name='jsonSchedules'),
    url(r'^json/expenses/(?P<band_id>\w+)$', views.json_expenses, name='jsonExpenses'),
    url(r'^json/moneyOwed/(?P<band_id>\w+)$', views.json_money_owed, name='jsonMoneyOwed'),
    url(r'^json/members/(?P<band_id>\w+)$', views.json_members, name='jsonMembers'),
    url(r'^json/add_member/(?P<band_id>\w+)$', views.json_add_member, name='jsonAddMember'),
    url(r'^json/edit_member$', views.json_edit_member, name='jsonEditMember'),
    url(r'^json/send_invitation$', views.json_send_invitation, name='jsonSendInvitation'),
    url(r'^json/add_merch/(?P<band_id>\w+)$', views.json_add_merch, name='jsonAddMerch'),
    url(r'^json/sell_trade_merch/(?P<band_id>\w+)$', views.json_sell_trade_merch, name='jsonSellTradeMerch'),
    url(r'^json/add_show/(?P<band_id>\w+)$', views.json_add_show, name='jsonAddShow'),
    url(r'^json/add_expense_payment/(?P<band_id>\w+)$', views.json_add_expense_payment, name='jsonAddExpensePayment'),
    url(r'^json/add_money_owed/(?P<band_id>\w+)$', views.json_add_money_owed, name='jsonAddMoneyOwed'),
    url(r'^json/remove_owed/(?P<band_id>\w+)$', views.json_remove_owed, name='jsonRemoveOwed'),
    url(r'^json/delete_item/(?P<band_id>\w+)$', views.json_delete_item, name='jsonDeleteItem'),
    url(r'^json/add_to_stock/(?P<band_id>\w+)$', views.json_add_to_stock, name='jsonAddToStock'),
    url(r'^json/change_price/(?P<band_id>\w+)$', views.json_change_price, name='jsonChangePrice'),
    url(r'^json/get_my_info$', views.json_get_my_info, name='jsonGetMyInfo'),
    url(r'^json/add_suggestion/$', views.json_add_suggestion, name='jsonAddSuggestion'),
    url(r'^thanks_for_suggestion$', views.thanks_for_suggestion, name='thanksForSuggestion'),

)

#Heroku specific static files setup
#from bandmanagerdjango import settings
#urlpatterns += patterns('',
#        (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
#    )