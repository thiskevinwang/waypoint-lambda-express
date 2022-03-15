project = "wp-nodejs-express"

variable "version" {
  default     = "latest"
  type        = string
  description = "Version"
}

variable "tag" {
  // default     = gitrefpretty()
  default     = "latest"
  type        = string
  description = "A tag"
}

variable "region" {
  default     = "us-east-1"
  type        = string
  description = "AWS region"
}

variable "architecture" {
  default     = "arm64"
  type        = string
  description = "AWS architecture"
}

variable "project" {
  default     = "wp-nodejs-express"
  type        = string
  description = "Application name"
}

variable "domain_name" {
  default     = "thekevinwang.com"
  type        = string
  description = "Domain name"
}

variable "sub_domain" {
  default     = "foobar"
  type        = string
  description = "Sub domain"
}

variable "r53_zone_id" {
  default     = "r53_zone_id"
  type        = string
  description = "Route53 hosted zone id"
}

app "wp-nodejs-express" {
  build {
    use "docker" {
      // buildkit = true
      // platform = "linux/amd64"

      // see builtin/docker/builder.go 
      build_args = {
        VERSION = var.version
      }
    }

    registry {
      use "aws-ecr" {
        region     = var.region
        repository = "wp-nodejs-express"
        tag        = var.tag
      }
    }
  }

  deploy {
    use "aws-lambda" {
      region = var.region
      memory = 512
      timeout = 30
    }
  }

  // release {
  //   use "aws-alb" {
  //     // name = "${substr(var.tag, 0, 7)}-${var.project}"
  //     // port = 80
  //     // zone_id     = var.r53_zone_id
  //     // domain_name = "${var.sub_domain}.${var.domain_name}"
  //   }
  // }
}