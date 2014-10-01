from django.db import models
from django.contrib.auth.models import User
import datetime

# Models for Band Manager:
# Band, Member, Show, Schedule, Expense, Owed, Merch, MerchOption

class Band(models.Model):
	name = models.CharField(max_length=50)
	currentBalance = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
	owner = models.ForeignKey(User)

	def __str__(self):
		return self.name

class Member(models.Model):
	band = models.ForeignKey('Band')
	MANAGER = 'MANAGER'
	MEMBER = 'MEMBER'
	CREW = 'CREW'
	STATUS_CHOICES = (
		(MANAGER, 'Manager'),
		(MEMBER, 'Member'),
		(CREW, 'Crew')
	)
	name = models.CharField(max_length=50)
	userName = models.ForeignKey(User, null=True)
	role = models.CharField(max_length=50, null=True, blank=True)
	phone = models.CharField(max_length=20, null=True, blank=True)
	email = models.EmailField(max_length=100, null=True, blank=True)
	status = models.CharField(max_length=50,
								choices=STATUS_CHOICES,
								default=MEMBER)
	def is_manager(self):
		return self.status in (self.MANAGER)

	def __str__(self):
		return self.name

class Show(models.Model):
	band = models.ForeignKey('Band')
	dateOfShow = models.DateTimeField()
	venue = models.CharField(max_length=50, null=True, blank=True)
	address = models.CharField(max_length=50, null=True, blank=True)
	cityState = models.CharField(max_length=50, null=True, blank=True)
	cost = models.CharField(max_length=50, null=True, blank=True)
	promoter = models.CharField(max_length=50, null=True, blank=True)
	promoterEmail = models.EmailField(max_length=100, null=True, blank=True)
	promoterPhone = models.CharField(max_length=20, null=True, blank=True)
	drinks = models.CharField(max_length=50, null=True, blank=True)
	meals = models.CharField(max_length=50, null=True, blank=True)
	guarantee = models.CharField(max_length=50, null=True, blank=True)
	parking = models.CharField(max_length=50, null=True, blank=True)
	lodging = models.CharField(max_length=50, null=True, blank=True)
	lodgingAddress = models.CharField(max_length=100, null=True, blank=True)
	guestList = models.TextField(max_length=500, null=True, blank=True)
	notes = models.TextField(max_length=500, null=True, blank=True)

	def __str__(self):
		return str(self.dateOfShow)

class Schedule(models.Model):
	band = models.ForeignKey('Band')
	show = models.ForeignKey('Show')
	time = models.TimeField()
	description = models.CharField(max_length=50, null=True, blank=True)
	website = models.CharField(max_length=100, null=True, blank=True)

	def __str__(self):
		if not self.description:
			return "(Empty)"
		else:
			return self.description

class Expense(models.Model):
	band = models.ForeignKey('Band')
	description = models.CharField(max_length=100)
	amount = models.DecimalField(max_digits=20, decimal_places=2)
	dateTime = models.DateTimeField()
	location = models.CharField(max_length=50, null=True, blank=True)
	addedBy = models.ForeignKey('Member',null=True,blank=True)

	def __str__(self):
		return self.description

class Owed(models.Model):
	band = models.ForeignKey('Band')
	description = models.CharField(max_length=100)
	amount = models.DecimalField(max_digits=20, decimal_places=2)
	dateTime = models.DateTimeField(null=True)
	who = models.CharField(max_length=50)

	def __str__(self):
		return self.description

class Merch(models.Model):
	band = models.ForeignKey('Band')
	name = models.CharField(max_length=50)
	notes = models.TextField(max_length=500, null=True, blank=True)

	def __str__(self):
		return self.name

class MerchOption(models.Model):
	band = models.ForeignKey('Band')
	merch = models.ForeignKey('Merch')
	description = models.CharField(max_length=50, null=True, blank=True)
	price = models.DecimalField(max_digits=20, decimal_places=2)
	quantity = models.IntegerField()
	numSold = models.IntegerField(default=0)
	numTraded = models.IntegerField(default=0)

	def __str__(self):
		if not self.description:
			return "(Empty)"
		else:
			return self.description

class Invitation(models.Model):
	band = models.ForeignKey('Band')
	email = models.CharField(max_length=100)
	active = models.BooleanField(default=False)

	def __str__(self):
		return self.email