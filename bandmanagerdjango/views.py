from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib import auth
from django.contrib.auth.models import User
from models import Band, Member, Merch, MerchOption, Show, Schedule, Expense, Owed, Invitation, Suggestion
from django.core.context_processors import csrf
from django.contrib.auth.forms import UserCreationForm
from django.template import RequestContext, Context, loader
from django.core import serializers
from django.views.decorators.csrf import ensure_csrf_cookie
import json
from django.core.mail import send_mail

def index(request):
    sug = Suggestion.objects.all()
    if request.user.is_authenticated():
        bandList = []
        invList = []
        memberIn = Member.objects.filter(userName=request.user)
        for member in memberIn:
            bandList.append(member.band)
        for inv in Invitation.objects.filter(email=request.user.email):
            if inv.active == True:
                invList.append(inv.band)
        context = {
            'success': '',
            'error': '',
            'show_sign_in': True,
            'bandList': bandList,
            'invList': invList,
            'username': request.user.username,
            'suggestions': sug
            }
    else:
        context = {
            'success': '',
            'error': '',
            'show_sign_in': False,
            'suggestions': sug
            }
    return render(request, 'index.html', context)

# ------------Register and Login------------------------------------------

def register_failure(request):
    error = "There was an error in your registration. Try again."
    showSignIn = False
    sug = Suggestion.objects.all()
    if request.user.is_authenticated():
        showSignIn = True
    context = {
        'error': error,
        'show_sign_in': showSignIn,
        'suggesions': sug
        }
    return render(request, 'index.html', context)

def login_failure(request):
    error = "There was a login error. Try again."
    showSignIn = False
    sug = Suggestion.objects.all()
    if request.user.is_authenticated():
        showSignIn = True
    context = {
        'error': error,
        'show_sign_in': showSignIn,
        'suggesions': sug
        }
    return render(request, 'index.html', context)

def login(request):
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')
    user = auth.authenticate(username=username, password=password)

    if user is not None:
        auth.login(request, user)
        return HttpResponseRedirect('/')
    else:
        return HttpResponseRedirect('/loginFailure')

def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('/')

def check_if_username_exists(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        if User.objects.filter(username=username).exists():
            return HttpResponse("true")
        else:
            return HttpResponse("false")

def register(request):
    if request.method == 'POST':
        username = request.POST.get('desiredUsername', False)
        if User.objects.filter(username=username).exists():
            #username exists... someone trying to hack it probably
            return HttpResponseRedirect('registerFailure')
        else:
            email = request.POST.get('registerEmail', False)
            password = request.POST.get('registerPassword', False)
            first_name = request.POST.get('firstName', False)
            last_name = request.POST.get('lastName', False)
            newUser = User.objects.create_user(username, email, password)
            newUser.first_name = first_name
            newUser.last_name = last_name
            newUser.save()
            #login the user
            user = auth.authenticate(username=username, password=password)
            if user is not None:
                auth.login(request, user)
                return HttpResponseRedirect('/')
            else:
                return HttpResponseRedirect('/loginFailure')

@login_required
def new_band(request):
    if request.method == 'POST':
        #create the band
        bandName = request.POST.get('bandName', False)
        newBand = Band(name=bandName, owner=request.user)
        newBand.save()
        newBandId = newBand.id
        #add user as member
        newMemberName = request.user.first_name + " " + request.user.last_name
        newMemberPhone = request.POST.get('phoneNumber', False)
        newMemberRole = request.POST.get('role', False)
        newMember = Member(
            band=newBand, 
            name=newMemberName, 
            userName=request.user, 
            role=newMemberRole, 
            phone=newMemberPhone, 
            email=request.user.email,
            status=Member.MANAGER
            )
        newMember.save()
        return HttpResponseRedirect('/app/' + str(newBandId))
    return HttpResponseRedirect('/')

# join a band!
@login_required
def join_band(request, band_id):
    if isInBand(request.user, band_id):
        #current user has been added to the band by manager
        #update the "member"
        theMember = Member.objects.filter(email=request.user.email)
        for mem in theMember:
            mem.userName = request.user
            mem.save()
        #set the invitation to inactive
        theBand = Band.objects.get(id=band_id)
        theInv = Invitation.objects.filter(email=request.user.email, band=theBand, active=True)
        for inv in theInv:
            inv.active = False
            inv.save()
        return HttpResponseRedirect('/app/' + band_id)
    return HttpResponse("failure")




#-----------------------Band Manager App Angular ------------------------------------------

@ensure_csrf_cookie
@login_required
def app(request, band_id):
    band = Band.objects.get(id=band_id)
    member = Member.objects.filter(band=band, userName=request.user)
    if member is not None:

        context = {
            'band_id': band_id,
            'band_name': band.name,
            'band_current_balance': band.currentBalance,
            'username': request.user.username,
            'user_id': request.user.id,
            'member_status': member[0].status #if there's conflicting member info, use the first one (will be manager)

        }
        return render(request, 'app.html', context)
    else:
        return HttpResponseRedirect('/')
    
#-------------------------JSON Serializers--------------------------------------------------

#determine if current user is in this band
def isInBand(user, band_id):
    band = Band.objects.get(id=band_id)
    member = Member.objects.filter(band=band, userName=user)
    if member is not None:
        return True
    else:
        return False

#determine if current user is a manager of the band
def isManager(user, band_id):
    band = Band.objects.get(id=band_id)
    member = Member.objects.filter(band=band, userName=user)
    if member is not None:
        for mem in member:
            if mem.status.upper() == "MANAGER":
                return True
        return False
    else:
        return False

#return the band name in JSON
#or update the band name
@login_required
def json_band(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if request.method == 'GET':
            return HttpResponse(serializers.serialize("json", Band.objects.filter(id=band_id)))
        if request.method == 'POST':
            band = Band.objects.get(id=band_id)
            data = json.loads(request.body)
            if "name" in data:
                if isManager(request.user, band_id):
                    band.name = data["name"]
                    band.save()
                    return HttpResponse("success")
            if "currentBalance" in data:
                band.currentBalance = data["currentBalance"]
                band.save()
                return HttpResponse("success")
    return HttpResponse("failure")

#check if the current user is the manager of a band
# of course this is just for display purposes.
# make sure on post actions to check if he's a manager as well.
@login_required
def json_check_if_manager(request, band_id):
    #current user is in the band?
    if isInBand(request.user, band_id):
        #is he a manager?
        if isManager(request.user, band_id):
            return HttpResponse("true")
        else:
            return HttpResponse("false")

#return the current user's info
@login_required
def json_get_my_info(request):
    #load data
    data = json.loads(request.body)
    if "band" in data:
        #get current band
        band_id = data["band"]
        band = Band.objects.get(id=band_id)
        #get the member(s) that you are
        member = Member.objects.filter(band=band, userName=request.user)
        return HttpResponse(serializers.serialize("json", member))
    return HttpResponse("failure")

#add a member to your band with JSON
@login_required
def json_add_member(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #current user is a manager
            if request.method == 'POST':
                #load data
                data = json.loads(request.body)
                #add an invitation to the email provided
                band = Band.objects.get(id=band_id)
                if "email" in data:
                    email = data["email"]
                else:
                    email = None
                newInv = Invitation(band=band, email=email, active=True)
                newInv.save()
                #add the member to the band regardless
                name = data["name"]
                role = data["role"]
                if "phone" in data:
                    phone = data["phone"]
                else:
                    phone = None
                status = data["status"]
                newMem = Member(band=band, name=name, role=role, phone=phone, status=status, email=email)
                newMem.save()
                return HttpResponse("success")
    return HttpResponse("failure")

#edit a member's data
@login_required
def json_edit_member(request):
    data = json.loads(request.body)
    if "band" in data:
        band_id = data["band"]
        if isInBand(request.user, band_id):
            #current user is in this band
            if isManager(request.user, band_id):
                #current user is a manager
                #get data
                if "name" in data:
                    name = data["name"]
                else:
                    name = None
                if "role" in data:
                    role = data["role"]
                else:
                    role = None
                if "email" in data:
                    email = data["email"]
                    #find existing invitations to email and change them
                    invitations = Invitation.objects.filter(email=email)
                    for inv in invitations:
                        inv.email = email
                        inv.save()
                else:
                    email = None
                if "phone" in data:
                    phone = data["phone"]
                else:
                    phone = None
                if "status" in data:
                    status = data["status"]
                else:
                    status = None
                if "pk" in data:
                    pk = data["pk"]
                else:
                    pk = None
                #find the member
                member = Member.objects.get(id=pk)
                #update the data
                member.name = name
                member.role = role
                member.email = email
                member.phone = phone
                member.status = status
                #save the member
                member.save()
                return HttpResponse("success")
    return HttpResponse("failure")

#send an invitation email to a new member
@login_required
def json_send_invitation(request):
    if request.method == 'POST':
        subject = "You've been invited to join a band on BandManager!"
        fromEmail = "nmyers322@gmail.com"
        data = json.loads(request.body)
        if "email" in data:
            toEmail = data["email"]
            band = data["band"]
            message = "Someone has added you to their band "
            message += band
            message += " on BandManager. To start using the app "
            message += "head over to BandManager and sign in using this email address. "
            send_mail(subject, message, fromEmail, [toEmail], fail_silently=True)
            return HttpResponse("success")
    #send_mail("BandManager", "Testing the send_invitation view.", "nmyers322@gmail.com", ["nmyers322@gmail.com"], fail_silently=False)
    return HttpResponse("failure")

#add an expense or payment using json
@login_required
def json_add_expense_payment(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        data = json.loads(request.body)
        desc = data["desc"]
        amount = data["amount"]
        dateTime = data["dateTime"]
        location = data["location"]
        memberList = Member.objects.filter(userName=request.user)
        member = memberList[0]
        band = Band.objects.get(id=band_id)
        expense = Expense(band=band, description=desc, amount=amount, dateTime=dateTime, location=location, addedBy=member)
        expense.save()
        return HttpResponse("success")
    return HttpResponse("failure")

#add money owed using json
@login_required
def json_add_money_owed(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        data = json.loads(request.body)
        desc = data["desc"]
        amount = data["amount"]
        dateTime = data["dateTime"]
        who = data["who"]
        band = Band.objects.get(id=band_id)
        owed = Owed(band=band, description=desc, amount=amount, dateTime=dateTime, who=who)
        owed.save()
        return HttpResponse("success")
    return HttpResponse("failure")

#remove money owed using json
@login_required
def json_remove_owed(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        data = json.loads(request.body)
        pk = data["pk"]
        owed = Owed.objects.get(id=pk)
        owed.delete()
        return HttpResponse("success")
    return HttpResponse("failure")

#add a show using json
@login_required
def json_add_show(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #user is a manager
            data = json.loads(request.body)
            dateOfShow = data["dateOfShow"]
            if "venue" in data:
                venue = data["venue"]
            else:
                venue = None
            if "address" in data:
                address = data["address"]
            else:
                address = None
            if "cityState" in data:
                cityState = data["cityState"]
            else:
                cityState = None
            if "cost" in data:
                cost = data["cost"]
            else:
                cost = None
            if "promoter" in data:
                promoter = data["promoter"]
            else:
                promoter = None
            if "promoterEmail" in data:
                promoterEmail = data["promoterEmail"]
            else:
                promoterEmail = None
            if "promoterPhone" in data:
                promoterPhone = data["promoterPhone"]
            else:
                promoterPhone = None
            if "drinks" in data:
                drinks = data["drinks"]
            else:
                drinks = None
            if "meals" in data:
                meals = data["meals"]
            else:
                meals = None
            if "guarantee" in data:
                guarantee = data["guarantee"]
            else:
                guarantee = None
            if "parking" in data:
                parking = data["parking"]
            else:
                parking = None
            if "lodging" in data:
                lodging = data["lodging"]
            else:
                lodging = None
            if "lodgingAddress" in data:
                lodgingAddress = data["lodgingAddress"]
            else:
                lodgingAddress = None
            if "guestList" in data:
                guestList = data["guestList"]
            else:
                guestList = None
            if "notes" in data:
                notes = data["notes"]
            else:
                notes = None
            band = Band.objects.get(id=band_id)
            theShow = Show(band=band,dateOfShow=dateOfShow,venue=venue,address=address,cityState=cityState,cost=cost,promoter=promoter,promoterEmail=promoterEmail,promoterPhone=promoterPhone,drinks=drinks,meals=meals,guarantee=guarantee,parking=parking,lodging=lodging,lodgingAddress=lodgingAddress,guestList=guestList,notes=notes)
            theShow.save()
            if "scheduleItems" in data:
                scheduleItems = data["scheduleItems"]
                for item in scheduleItems:
                    time = item["time"]
                    if "description" in item:
                        desc = item["description"]
                    else: 
                        desc = None
                    if "website" in item:
                        website = item["website"]
                    else:
                        website = None
                    newItem = Schedule(band=band, show=theShow, time=time, description=desc, website=website)
                    newItem.save()
            return HttpResponse(data)
    return HttpResponse("failure")

#add a merch item using json
@login_required
def json_add_merch(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #user is a manager
            data = json.loads(request.body)
            name = data["name"]
            if "notes" in data:
                notes = data["notes"]
            else:
                notes = None
            band = Band.objects.get(id=band_id)
            newMerch = Merch(band=band, name=name, notes=notes)
            newMerch.save()
            if "options" in data:
                merchOptions = data["options"]
                for option in merchOptions:
                    if "description" in option:
                        desc = option["description"]
                    else:
                        desc = None
                    price = option["price"]
                    quantity = option["quantity"]
                    newMerchOption = MerchOption(band=band,merch=newMerch,description=desc,price=price,quantity=quantity,numSold=0,numTraded=0)
                    newMerchOption.save()
                return HttpResponse("success 2")
            return HttpResponse("success")
    return HttpResponse("failure")

#sell or trade merch item
@login_required
def json_sell_trade_merch(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        #the backend will:
        #   deduct stock, add cash to balance, create expense record, add to numSold, add to numTraded
        #get the data from post
        data = json.loads(request.body)
        merchPk = data["merchPk"]
        merchOptionPk = data["merchOptionPk"]
        sellOrTrade = data["sellOrTrade"]
        #get the merch item
        merch = Merch.objects.get(id=merchPk)
        merchOption = MerchOption.objects.get(id=merchOptionPk)
        #deduct from stock
        merchOption.quantity = merchOption.quantity - 1
        #add to numSold or numTraded
        if sellOrTrade == "sell":
            merchOption.numSold = merchOption.numSold + 1
            #create expense record
            band = Band.objects.get(id=band_id)
            timeStamp = data["timeStamp"]
            desc = data["desc"]
            location = data["location"]
            amount = merchOption.price
            member = Member.objects.filter(userName=request.user)
            newExpense = Expense(band=band,description=desc,amount=amount,dateTime=timeStamp,location=location,addedBy=member[0])
            #add to currentBalance
            band.currentBalance = band.currentBalance + amount
            #save everything
            merchOption.save()
            band.save()
            newExpense.save()
        if sellOrTrade == "trade":
            merchOption.numTraded = merchOption.numTraded + 1
            #save everything
            merchOption.save()
        
        return HttpResponse("success")
    return HttpResponse("failure")
        
#delete an item
@login_required
def json_delete_item(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #get the data from post
            data = json.loads(request.body)
            merchPk = data["merchPk"]
            merchOptionPk = data["merchOptionPk"]
            merch = Merch.objects.get(id=merchPk)
            merchOption = MerchOption.objects.get(id=merchOptionPk)
            merchOption.delete()
            checkOptions = MerchOption.objects.filter(merch=merch)
            if not checkOptions:
                #there are no more options connected to this merch item so delete it too
                merch.delete()
                return HttpResponse("success")
            else:
                return HttpResponse("success")
    return HttpResponse("failure")

#add some items to stock (update quantity)
@login_required
def json_add_to_stock(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #get the data from post
            data = json.loads(request.body)
            merchPk = data["merchPk"]
            merchOptionPk = data["merchOptionPk"]
            merch = Merch.objects.get(id=merchPk)
            merchOption = MerchOption.objects.get(id=merchOptionPk)
            stock = merchOption.quantity
            addStock = data["numToAddToStock"]
            try:
                addStock = int(addStock)
            except:
                return HttpResponse("failure")
            merchOption.quantity = stock + addStock
            merchOption.save()
            return HttpResponse("success")
    return HttpResponse("failure")

#change the price of an item
@login_required
def json_change_price(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        if isManager(request.user, band_id):
            #get the data from post
            data = json.loads(request.body)
            merchPk = data["merchPk"]
            merchOptionPk = data["merchOptionPk"]
            price = data["newPrice"]
            merch = Merch.objects.get(id=merchPk)
            merchOption = MerchOption.objects.get(id=merchOptionPk)
            merchOption.price = price
            merchOption.save()
            return HttpResponse("success")
    return HttpResponse("failure")

#return the merch in JSON
@login_required
def json_merch(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Merch.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return the merch options in JSON
@login_required
def json_merch_options(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", MerchOption.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return the list of shows in JSON
@login_required
def json_shows(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Show.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return all of the shows schedules in JSON
@login_required
def json_schedules(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Schedule.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return a list of expenses/payments in JSON
@login_required
def json_expenses(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Expense.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return a list of money owed in JSON
@login_required
def json_money_owed(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Owed.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#return members in JSON
@login_required
def json_members(request, band_id):
    if isInBand(request.user, band_id):
        #current user is in this band
        myBand = Band.objects.get(id=band_id)
        return HttpResponse(serializers.serialize("json", Member.objects.filter(band=myBand)))
    return HttpResponseRedirect('/')

#add a suggestion on the main page
def json_add_suggestion(request):
    if request.method == "POST":
        text = request.POST.get('addSuggestion', '(someone input invalid text)')
        sug = Suggestion(text=text)
        sug.save()
        return HttpResponseRedirect('/thanks_for_suggestion')
    return HttpResponse("failure")

#show success msg
def thanks_for_suggestion(request):
    success = "Thanks for the suggestion!"
    showSignIn = False
    sug = Suggestion.objects.all()
    if request.user.is_authenticated():
        showSignIn = True
    context = {
        'error': '',
        'show_sign_in': showSignIn,
        'suggestions': sug,
        'success': success
        }
    return render(request, 'index.html', context)
