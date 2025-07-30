"""
Serializers para o Sistema Administrativo
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .admin_models import UserProfile, Department, AdminLog, PushNotification

class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer para Department"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'parent', 'parent_name', 'full_path', 
                 'created_at', 'created_by', 'users_count']
        read_only_fields = ['created_at', 'created_by', 'full_path', 'parent_name', 'users_count']
    
    def get_users_count(self, obj):
        return obj.users.count()

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para UserProfile"""
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.nome', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    subordinates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'nome', 'email', 'username', 'telefone', 'role', 'status', 
                 'department', 'department_name', 'manager', 'manager_name',
                 'created_by', 'created_by_name', 'blocked_at', 'last_login',
                 'google_id', 'picture_url', 'subordinates_count']
        read_only_fields = ['created_by', 'created_by_name', 'username', 'department_name', 
                           'manager_name', 'subordinates_count']
    
    def get_subordinates_count(self, obj):
        return obj.subordinates.count()
    
    def create(self, validated_data):
        """Criar novo usuário com perfil"""
        email = validated_data.pop('user')['email']
        
        # Criar ou obter usuário Django
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': validated_data.get('nome', '').split()[0] if validated_data.get('nome') else '',
                'last_name': ' '.join(validated_data.get('nome', '').split()[1:]) if validated_data.get('nome') else ''
            }
        )
        
        if not created:
            # Atualizar nome do usuário se já existe
            user.first_name = validated_data.get('nome', '').split()[0] if validated_data.get('nome') else ''
            user.last_name = ' '.join(validated_data.get('nome', '').split()[1:]) if validated_data.get('nome') else ''
            user.save()
        
        # Criar perfil administrativo
        validated_data['user'] = user
        validated_data['created_by'] = self.context['request'].user
        
        return UserProfile.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Atualizar usuário e perfil"""
        if 'user' in validated_data:
            email_data = validated_data.pop('user')
            if 'email' in email_data:
                instance.user.email = email_data['email']
                instance.user.username = email_data['email']
                instance.user.save()
        
        # Atualizar nome no modelo User também
        if 'nome' in validated_data:
            nome_parts = validated_data['nome'].split()
            instance.user.first_name = nome_parts[0] if nome_parts else ''
            instance.user.last_name = ' '.join(nome_parts[1:]) if len(nome_parts) > 1 else ''
            instance.user.save()
        
        return super().update(instance, validated_data)

class AdminLogSerializer(serializers.ModelSerializer):
    """Serializer para AdminLog"""
    admin_name = serializers.CharField(source='admin.username', read_only=True)
    target_user_name = serializers.CharField(source='target_user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_name', 'action', 'action_display', 
                 'target_user', 'target_user_name', 'details', 'ip_address', 'created_at']
        read_only_fields = ['admin', 'admin_name', 'target_user_name', 'action_display', 'created_at']

class PushNotificationSerializer(serializers.ModelSerializer):
    """Serializer para PushNotification"""
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = PushNotification
        fields = ['id', 'sender', 'sender_name', 'recipient', 'recipient_name',
                 'title', 'message', 'type', 'type_display', 'sent_at', 'read_at', 'is_read']
        read_only_fields = ['sender', 'sender_name', 'recipient_name', 'type_display', 
                           'sent_at', 'is_read']
    
    def get_is_read(self, obj):
        return obj.read_at is not None
    
    def create(self, validated_data):
        """Criar nova notificação"""
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class UserStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de usuários"""
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    blocked_users = serializers.IntegerField()
    admin_users = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    recent_logins = serializers.IntegerField()

class UserHierarchySerializer(serializers.ModelSerializer):
    """Serializer para hierarquia de usuários"""
    subordinates = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    level = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'nome', 'email', 'role', 'status', 'department_name', 
                 'manager', 'subordinates', 'level']
        read_only_fields = ['subordinates', 'level', 'department_name']
    
    def get_subordinates(self, obj):
        """Obter subordinados recursivamente"""
        subordinates = obj.subordinates.all()
        return UserHierarchySerializer(subordinates, many=True, context=self.context).data
    
    def get_level(self, obj):
        """Calcular nível na hierarquia"""
        level = 0
        current = obj
        while current.manager:
            level += 1
            current = current.manager
            if level > 10:  # Evitar loop infinito
                break
        return level
