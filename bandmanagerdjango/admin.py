from django.contrib import admin
from bandmanagerdjango.models import Band, Member, Show, Schedule, Expense, Owed, Merch, MerchOption

admin.site.register(Band)
admin.site.register(Member)
admin.site.register(Show)
admin.site.register(Schedule)
admin.site.register(Expense)
admin.site.register(Owed)
admin.site.register(Merch)
admin.site.register(MerchOption)

