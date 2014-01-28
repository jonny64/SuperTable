#!/usr/bin/env ruby
require 'rubygems'; require 'bundler/setup'; Bundler.require
require 'open-uri'

# Формат: https://gist.github.com/dapi/8649553

file = ARGV[0] || raise("Укажите файл для парсинга параметром")

doc = Nokogiri::HTML( open(file), nil, 'UTF-8')

AVAILABLE_ATTRIBUTES=['rowspan', 'colspan', 'style', 'class', 'title', 'onclick']


def parse_rows doc, path
  row_num = 0
  rows = {}
  doc.xpath(path).each do |tr|
    row_num += 1
    row = { data: [] }
    tr.xpath('th|td').each do |th|
      cell = { content: th.content }
      AVAILABLE_ATTRIBUTES.each do |attr|
        value = th.attribute attr
        cell[attr] = value.to_s unless value.nil? || value.blank?
      end
      row[:data] << cell
    end
    rows[row_num] = row
  end

  rows
end

table = {
  header: parse_rows(doc, '//thead/tr'),
  data: parse_rows(doc, '//tbody/tr')
}

puts table.to_json
