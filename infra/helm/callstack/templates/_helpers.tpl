{{/*
Expand the name of the chart.
*/}}
{{- define "callstack.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "callstack.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "callstack.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "callstack.labels" -}}
helm.sh/chart: {{ include "callstack.chart" . }}
{{ include "callstack.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "callstack.selectorLabels" -}}
app.kubernetes.io/name: {{ include "callstack.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "callstack.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "callstack.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the image name
*/}}
{{- define "callstack.image" -}}
{{- $registry := .Values.image.registry -}}
{{- if .Values.global }}
{{- if .Values.global.imageRegistry }}
{{- $registry = .Values.global.imageRegistry -}}
{{- end -}}
{{- end -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- if .Values.global }}
{{- if .Values.global.imageTag }}
{{- $tag = .Values.global.imageTag -}}
{{- end -}}
{{- end -}}
{{- if .Values.image.digest }}
{{- $tag = .Values.image.digest -}}
{{- end -}}
{{- printf "%s/%s:%s" $registry .Values.image.repository $tag -}}
{{- end }}

{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "callstack.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.webhook.image .Values.coreAdmissionController.image .Values.cleanupJob.image) "global" .Values.global) -}}
{{- end }}

{{/*
Create a default fully qualified webhook name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "callstack.webhook.fullname" -}}
{{- if .Values.webhook.fullnameOverride -}}
{{- .Values.webhook.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "webhook" .Values.webhook.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Return the webhook cert secret name
*/}}
{{- define "callstack.webhook.certSecret" -}}
{{- if .Values.webhook.certSecret -}}
{{- .Values.webhook.certSecret -}}
{{- else -}}
{{- printf "%s-%s" (include "callstack.fullname" .) "webhook-cert" -}}
{{- end -}}
{{- end -}}

{{/*
Return the webhook CA secret name
*/}}
{{- define "callstack.webhook.caSecret" -}}
{{- if .Values.webhook.caSecret -}}
{{- .Values.webhook.caSecret -}}
{{- else -}}
{{- printf "%s-%s" (include "callstack.fullname" .) "webhook-ca" -}}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "callstack.webhook.serviceAccountName" -}}
{{- if .Values.webhook.serviceAccount.create -}}
{{- default (include "callstack.webhook.fullname" .) .Values.webhook.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.webhook.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Return the Docker Image Registry Secret Names for webhook
*/}}
{{- define "callstack.webhook.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.webhook.image) "global" .Values.global) -}}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "callstack.coreAdmissionController.serviceAccountName" -}}
{{- if .Values.coreAdmissionController.serviceAccount.create -}}
{{- default (include "callstack.fullname" .) .Values.coreAdmissionController.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.coreAdmissionController.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Return the Docker Image Registry Secret Names for coreAdmissionController
*/}}
{{- define "callstack.coreAdmissionController.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.coreAdmissionController.image) "global" .Values.global) -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "callstack.cleanupJob.serviceAccountName" -}}
{{- if .Values.cleanupJob.serviceAccount.create -}}
{{- default (include "callstack.fullname" .) .Values.cleanupJob.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.cleanupJob.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Return the Docker Image Registry Secret Names for cleanupJob
*/}}
{{- define "callstack.cleanupJob.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.cleanupJob.image) "global" .Values.global) -}}
{{- end -}}